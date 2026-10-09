import { recordRateLimit, recordSchedulerQueueSize, recordSchedulerDefer, recordSchedulerEnqueue, recordSchedulerEnd, recordSchedulerStart } from "../diagnostics/performanceInstrumentation.js";
/**
 * SportLab V11.7.1 — API Request Scheduler
 *
 * File centrale pour tous les appels vers l'API Bridge (Football/Rugby/NFL).
 * Objectifs : supprimer les rafales, prioriser les fixtures et appliquer une
 * pause par sport lorsqu'API-Sports répond 429.
 */
const IS_SNAPSHOT_BUILD = typeof process !== "undefined" && process?.env?.SPORTLAB_SNAPSHOT_BUILD === "1";
const MIN_GAP_MS = IS_SNAPSHOT_BUILD ? 5000 : 900;
const DEFAULT_RATE_LIMIT_PAUSE_MS = IS_SNAPSHOT_BUILD ? 90000 : 15000;
const MAX_RATE_LIMIT_PAUSE_MS = IS_SNAPSHOT_BUILD ? 180000 : 60000;
const START_WINDOW_MS = 60000;
const MAX_STARTS_PER_WINDOW = 10;

let queue = [];
let running = false;
let sequence = 0;
let lastStartedAt = 0;
let requestStarts = [];
const pauses = new Map();
const RATE_LIMIT_MEMORY_MS = 120000;
const CIRCUIT_PAUSE_MS = 120000;
const CIRCUIT_STORAGE_KEY = "sportlab:api-pause:v2";
function scopeFor(path = "") { return /^\/(football|rugby|nfl)(?:\/|$)/.exec(path)?.[1] || "global"; }
function pauseFor(scope) {
  if (!pauses.has(scope)) pauses.set(scope, { blockedUntil: 0, circuitUntil: 0, rateLimitStreak: 0, lastRateLimitAt: 0 });
  return pauses.get(scope);
}
try {
  const saved = JSON.parse(globalThis.localStorage?.getItem(CIRCUIT_STORAGE_KEY) || "{}");
  // Preserve a still-active protection from the previous release, once only.
  const old = JSON.parse(globalThis.localStorage?.getItem("sportlab:api-pause:v1") || "null");
  if (old?.until > Date.now()) saved.global = Math.max(saved.global || 0, old.until);
  if (!IS_SNAPSHOT_BUILD) for (const scope of ["global", "rugby", "football", "nfl"]) {
    if (saved[scope] > Date.now() && saved[scope] <= Date.now() + 86400000) {
      Object.assign(pauseFor(scope), { blockedUntil: saved[scope], circuitUntil: saved[scope] });
    }
  }
} catch {}
function saveCircuit() {
  try { globalThis.localStorage?.setItem(CIRCUIT_STORAGE_KEY, JSON.stringify(Object.fromEntries([...pauses].map(([scope, state]) => [scope, state.circuitUntil])))); } catch {}
}
export function getApiPauseUntil(path = "") {
  return Math.max(pauseFor(scopeFor(path)).blockedUntil, pauseFor("global").blockedUntil);
}
function circuitDeadline(path) {
  return Math.max(pauseFor(scopeFor(path)).circuitUntil, pauseFor("global").circuitUntil);
}
let wakeDrain = null;
function wake() { wakeDrain?.(); }
function waitForChange(ms) {
  return new Promise(resolve => {
    const finish = () => { clearTimeout(timer); if (wakeDrain === finish) wakeDrain = null; resolve(); };
    const timer = setTimeout(finish, ms);
    wakeDrain = finish;
  });
}
export function applyApiCooldown(retryAfterMs, { path = "" } = {}) {
  const scope = scopeFor(path);
  const state = pauseFor(scope);
  state.circuitUntil = Math.max(state.circuitUntil, Date.now() + Math.max(1000, Number(retryAfterMs) || 60000));
  state.blockedUntil = Math.max(state.blockedUntil, state.circuitUntil);
  saveCircuit();
  const pending = queue.filter(item => scope === "global" || scopeFor(item.path) === scope);
  queue = queue.filter(item => !pending.includes(item));
  recordSchedulerQueueSize(queue.length);
  for (const item of pending) rejectItem(item, deferredError("API_QUEUE_CIRCUIT_OPEN", state.circuitUntil - Date.now()));
  wake();
}

function deferredError(code, retryAfterMs = 0) {
  const error = new Error("Récupération différée : API occupée. Les dernières données sont conservées ; réessayez après la pause.");
  Object.assign(error, { code, status: 503, deferred: true, retryAfterMs });
  return error;
}

function rejectItem(item, error) {
  clearTimeout(item.timer);
  recordSchedulerDefer({ code: error.code, path: item.path, retryAfterMs: error.retryAfterMs });
  item.reject(error);
}

export function scheduleApiRequest(task, { priority = 0, path = "", maxQueueWaitMs = IS_SNAPSHOT_BUILD ? 600000 : 45000 } = {}) {
  return new Promise((resolve, reject) => {
    if (!IS_SNAPSHOT_BUILD && circuitDeadline(path) > Date.now()) {
      recordSchedulerDefer({ code: "API_QUEUE_CIRCUIT_OPEN", path, retryAfterMs: circuitDeadline(path) - Date.now() });
      reject(deferredError("API_QUEUE_CIRCUIT_OPEN", circuitDeadline(path) - Date.now()));
      return;
    }
    const perfEnqueuedAt = recordSchedulerEnqueue();
    const item = { task, path, priority: Number(priority) || 0, sequence: sequence++, resolve, reject, perfEnqueuedAt };
    item.timer = setTimeout(() => {
      const index = queue.indexOf(item);
      if (index < 0) return;
      queue.splice(index, 1);
      recordSchedulerQueueSize(queue.length);
      rejectItem(item, deferredError("API_QUEUE_WAIT_EXPIRED", Math.max(0, getApiPauseUntil(path) - Date.now())));
    }, Math.max(1, Number(maxQueueWaitMs) || 45000));
    queue.push(item);
    wake();
    recordSchedulerQueueSize(queue.length);
    queue.sort((a, b) => b.priority - a.priority || a.sequence - b.sequence);
    void drain();
  });
}

export function applyGlobalRateLimit(retryAfterMs = 0, { path = "" } = {}) {
  const scope = scopeFor(path);
  const state = pauseFor(scope);
  const requested = Math.max(0, Number(retryAfterMs) || 0);
  if (Date.now() - state.lastRateLimitAt >= RATE_LIMIT_MEMORY_MS) state.rateLimitStreak = 0;
  state.lastRateLimitAt = Date.now();
  state.rateLimitStreak += 1;
  const adaptivePause = Math.min(MAX_RATE_LIMIT_PAUSE_MS, DEFAULT_RATE_LIMIT_PAUSE_MS * (2 ** Math.min(8, state.rateLimitStreak - 1)));
  const pause = Math.max(adaptivePause, requested);
  state.blockedUntil = Math.max(state.blockedUntil, Date.now() + pause);
  if (!IS_SNAPSHOT_BUILD && (state.rateLimitStreak >= 2 || requested >= 45000)) {
    applyApiCooldown(Math.max(state.blockedUntil - Date.now(), state.rateLimitStreak >= 2 ? CIRCUIT_PAUSE_MS : requested), { path });
  }
  recordRateLimit({ path, scope, pauseMs: state.blockedUntil - Date.now(), retryAfterMs: requested, blockedUntil: state.blockedUntil, circuitOpen: state.circuitUntil > Date.now() });
  wake();
  return pause;
}
export function getApiSchedulerState() {
  return { queued: queue.length, running, ...pauseFor("global"), scopes: Object.fromEntries(pauses), minGapMs: MIN_GAP_MS };
}

async function drain() {
  if (running) return;
  running = true;
  try {
    while (queue.length) {
      // V11.8.4.4 — Non-Blocking Fixtures. Never reserve an item before a
      // scheduler pause. Requests may arrive while we wait (especially fixture
      // lists); once the pause expires, re-sort and select the highest priority
      // item that is actually ready to start.
      if (IS_SNAPSHOT_BUILD) await waitForStartWindow();
      const gap = Math.max(0, MIN_GAP_MS - (Date.now() - lastStartedAt));
      if (gap > 0) { await waitForChange(gap); continue; }
      queue.sort((a, b) => b.priority - a.priority || a.sequence - b.sequence);
      const index = queue.findIndex(item => getApiPauseUntil(item.path) <= Date.now());
      if (index < 0) {
        await waitForChange(Math.max(1, Math.min(...queue.map(item => getApiPauseUntil(item.path))) - Date.now()));
        continue;
      }
      const [item] = queue.splice(index, 1);
      recordSchedulerQueueSize(queue.length);
      if (!item) continue;
      clearTimeout(item.timer);
      lastStartedAt = Date.now();
      if (IS_SNAPSHOT_BUILD) recordRequestStart(lastStartedAt);
      const perfStartedAt = recordSchedulerStart(item.perfEnqueuedAt);
      try { item.resolve(await item.task()); recordSchedulerEnd(perfStartedAt, true); }
      catch (error) { recordSchedulerEnd(perfStartedAt, false); item.reject(error); }
    }
  } finally {
    running = false;
    if (queue.length) void drain();
  }
}

function recordRequestStart(now) {
  requestStarts = requestStarts.filter(startedAt => now - startedAt < START_WINDOW_MS);
  requestStarts.push(now);
}

async function waitForStartWindow() {
  while (true) {
    const now = Date.now();
    requestStarts = requestStarts.filter(startedAt => now - startedAt < START_WINDOW_MS);
    if (requestStarts.length < MAX_STARTS_PER_WINDOW) return;
    const waitMs = Math.max(1, START_WINDOW_MS - (now - requestStarts[0]) + 50);
    await wait(waitMs);
  }
}

function wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
