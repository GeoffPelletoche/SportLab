import { recordRateLimit, recordSchedulerEnqueue, recordSchedulerEnd, recordSchedulerStart } from "../diagnostics/performanceInstrumentation.js";
/**
 * SportLab V11.7.1 — API Request Scheduler
 *
 * File centrale pour tous les appels vers l'API Bridge (Football/Rugby/NFL).
 * Objectifs : supprimer les rafales, prioriser les fixtures et appliquer une
 * pause globale lorsqu'API-Sports répond 429.
 */
const IS_SNAPSHOT_BUILD = typeof process !== "undefined" && process?.env?.SPORTLAB_SNAPSHOT_BUILD === "1";
const MIN_GAP_MS = IS_SNAPSHOT_BUILD ? 2500 : 900;
const DEFAULT_RATE_LIMIT_PAUSE_MS = IS_SNAPSHOT_BUILD ? 75000 : 15000;
const MAX_RATE_LIMIT_PAUSE_MS = IS_SNAPSHOT_BUILD ? 120000 : 60000;
const SNAPSHOT_WINDOW_MS = 60000;
const SNAPSHOT_MAX_STARTS_PER_WINDOW = 15;

let queue = [];
let running = false;
let sequence = 0;
let lastStartedAt = 0;
let blockedUntil = 0;
let snapshotStarts = [];

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
      const item = queue.shift();
      if (IS_SNAPSHOT_BUILD) await waitForSnapshotWindow();
      const waitMs = Math.max(0, blockedUntil - Date.now(), MIN_GAP_MS - (Date.now() - lastStartedAt));
      if (waitMs > 0) await wait(waitMs);
      lastStartedAt = Date.now();
      if (IS_SNAPSHOT_BUILD) recordSnapshotStart(lastStartedAt);
      const perfStartedAt = recordSchedulerStart(item.perfEnqueuedAt);
      try { item.resolve(await item.task()); recordSchedulerEnd(perfStartedAt, true); }
      catch (error) { recordSchedulerEnd(perfStartedAt, false); item.reject(error); }
    }
  } finally {
    running = false;
    if (queue.length) void drain();
  }
}

function recordSnapshotStart(now) {
  snapshotStarts = snapshotStarts.filter(startedAt => now - startedAt < SNAPSHOT_WINDOW_MS);
  snapshotStarts.push(now);
}

async function waitForSnapshotWindow() {
  while (true) {
    const now = Date.now();
    snapshotStarts = snapshotStarts.filter(startedAt => now - startedAt < SNAPSHOT_WINDOW_MS);
    if (snapshotStarts.length < SNAPSHOT_MAX_STARTS_PER_WINDOW) return;
    const waitMs = Math.max(1, SNAPSHOT_WINDOW_MS - (now - snapshotStarts[0]) + 50);
    await wait(waitMs);
  }
}

function wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
