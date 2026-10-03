import { recordRateLimit, recordSchedulerEnqueue, recordSchedulerEnd, recordSchedulerStart } from "../diagnostics/performanceInstrumentation.js";
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
let requestStarts = [];

export function scheduleApiRequest(task, { priority = 0 } = {}) {
  return new Promise((resolve, reject) => {
    const perfEnqueuedAt = recordSchedulerEnqueue();
    queue.push({ task, priority: Number(priority) || 0, sequence: sequence++, resolve, reject, perfEnqueuedAt });
    queue.sort((a, b) => b.priority - a.priority || a.sequence - b.sequence);
    void drain();
  });
}

export function applyGlobalRateLimit(retryAfterMs = 0) {
  const requested = Number(retryAfterMs) || DEFAULT_RATE_LIMIT_PAUSE_MS;
  const pause = Math.max(DEFAULT_RATE_LIMIT_PAUSE_MS, Math.min(MAX_RATE_LIMIT_PAUSE_MS, requested));
  recordRateLimit();
  blockedUntil = Math.max(blockedUntil, Date.now() + pause);
  return pause;
}

export function getApiSchedulerState() {
  return { queued: queue.length, running, blockedUntil, minGapMs: MIN_GAP_MS };
}

async function drain() {
  if (running) return;
  running = true;
  try {
    while (queue.length) {
      // V11.8.4.3 — Non-Blocking Fixtures. Never reserve an item before a
      // scheduler pause. Requests may arrive while we wait (especially fixture
      // lists); once the pause expires, re-sort and select the highest priority
      // item that is actually ready to start.
      if (IS_SNAPSHOT_BUILD) await waitForStartWindow();
      const waitMs = Math.max(0, blockedUntil - Date.now(), MIN_GAP_MS - (Date.now() - lastStartedAt));
      if (waitMs > 0) await wait(waitMs);
      queue.sort((a, b) => b.priority - a.priority || a.sequence - b.sequence);
      const item = queue.shift();
      if (!item) continue;
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
