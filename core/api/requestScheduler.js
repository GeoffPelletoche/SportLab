import { recordRateLimit, recordSchedulerQueueSize, recordSchedulerDefer, recordSchedulerEnqueue, recordSchedulerEnd, recordSchedulerStart } from "../diagnostics/performanceInstrumentation.js";
/**
 * SportLab V11.7.1 — API Request Scheduler
 *
 * File centrale pour tous les appels vers l'API Bridge (Football/Rugby/NFL).
 * Objectifs : supprimer les rafales, prioriser les fixtures et appliquer une
 * pause globale lorsqu'API-Sports répond 429.
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
let blockedUntil = 0;
let rateLimitStreak = 0;
let requestStarts = [];
let lastRateLimitAt = 0;
let circuitUntil = 0;
const RATE_LIMIT_MEMORY_MS = 120000;
const CIRCUIT_PAUSE_MS = 120000;
const CIRCUIT_STORAGE_KEY = "sportlab:api-pause:v1";
try {
  const saved = JSON.parse(globalThis.localStorage?.getItem(CIRCUIT_STORAGE_KEY) || "null");
  if (!IS_SNAPSHOT_BUILD && saved?.until > Date.now() && saved.until <= Date.now() + 86400000) {
    circuitUntil = blockedUntil = saved.until;
  }
} catch { /* Storage is optional, including private browsing. */ }

function saveCircuit() {
  try { globalThis.localStorage?.setItem(CIRCUIT_STORAGE_KEY, JSON.stringify({ until: circuitUntil })); } catch {}
}

export function applyApiCooldown(retryAfterMs, { path = "" } = {}) {
  circuitUntil = Math.max(circuitUntil, Date.now() + Math.max(1000, Number(retryAfterMs) || 60000));
  blockedUntil = Math.max(blockedUntil, circuitUntil);
  saveCircuit();
  const pending = queue;
  queue = [];
  recordSchedulerQueueSize(0);
  for (const item of pending) rejectItem(item, deferredError("API_QUEUE_CIRCUIT_OPEN", circuitUntil - Date.now()));
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
    if (!IS_SNAPSHOT_BUILD && circuitUntil > Date.now()) {
      recordSchedulerDefer({ code: "API_QUEUE_CIRCUIT_OPEN", path, retryAfterMs: circuitUntil - Date.now() });
      reject(deferredError("API_QUEUE_CIRCUIT_OPEN", circuitUntil - Date.now()));
      return;
    }
    const perfEnqueuedAt = recordSchedulerEnqueue();
    const item = { task, path, priority: Number(priority) || 0, sequence: sequence++, resolve, reject, perfEnqueuedAt };
    item.timer = setTimeout(() => {
      const index = queue.indexOf(item);
      if (index < 0) return;
      queue.splice(index, 1);
      recordSchedulerQueueSize(queue.length);
      rejectItem(item, deferredError("API_QUEUE_WAIT_EXPIRED", Math.max(0, blockedUntil - Date.now())));
    }, Math.max(1, Number(maxQueueWaitMs) || 45000));
    queue.push(item);
    recordSchedulerQueueSize(queue.length);
    queue.sort((a, b) => b.priority - a.priority || a.sequence - b.sequence);
    void drain();
  });
}

export function applyGlobalRateLimit(retryAfterMs = 0, { path = "" } = {}) {
  const requested = Math.max(0, Number(retryAfterMs) || 0);
  if (Date.now() - lastRateLimitAt >= RATE_LIMIT_MEMORY_MS) rateLimitStreak = 0;
  lastRateLimitAt = Date.now();
  rateLimitStreak += 1;
  const adaptivePause = Math.min(MAX_RATE_LIMIT_PAUSE_MS, DEFAULT_RATE_LIMIT_PAUSE_MS * (2 ** Math.min(8, rateLimitStreak - 1)));
  // A provider deadline longer than our normal pause must never be shortened.
  const pause = Math.max(adaptivePause, requested);
  blockedUntil = Math.max(blockedUntil, Date.now() + pause);
  if (!IS_SNAPSHOT_BUILD && (rateLimitStreak >= 2 || requested >= 45000)) {
    applyApiCooldown(Math.max(blockedUntil - Date.now(), rateLimitStreak >= 2 ? CIRCUIT_PAUSE_MS : requested), { path });
  }
  recordRateLimit({ path, pauseMs: blockedUntil - Date.now(), retryAfterMs: requested, blockedUntil, circuitOpen: circuitUntil > Date.now() });
  return pause;
}

export function getApiSchedulerState() {
  return { queued: queue.length, running, blockedUntil, circuitUntil, rateLimitStreak, minGapMs: MIN_GAP_MS };
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
      const waitMs = Math.max(0, blockedUntil - Date.now(), MIN_GAP_MS - (Date.now() - lastStartedAt));
      if (waitMs > 0) { await wait(waitMs); continue; }
      queue.sort((a, b) => b.priority - a.priority || a.sequence - b.sequence);
      const item = queue.shift();
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
