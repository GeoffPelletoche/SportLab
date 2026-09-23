/**
 * SportLab V11.7.1 — API Request Scheduler
 *
 * File centrale pour tous les appels vers l'API Bridge (Football/Rugby/NFL).
 * Objectifs : supprimer les rafales, prioriser les fixtures et appliquer une
 * pause globale lorsqu'API-Sports répond 429.
 */
const MIN_GAP_MS = 900;
const DEFAULT_RATE_LIMIT_PAUSE_MS = 15000;
const MAX_RATE_LIMIT_PAUSE_MS = 60000;

let queue = [];
let running = false;
let sequence = 0;
let lastStartedAt = 0;
let blockedUntil = 0;

export function scheduleApiRequest(task, { priority = 0 } = {}) {
  return new Promise((resolve, reject) => {
    queue.push({ task, priority: Number(priority) || 0, sequence: sequence++, resolve, reject });
    queue.sort((a, b) => b.priority - a.priority || a.sequence - b.sequence);
    void drain();
  });
}

export function applyGlobalRateLimit(retryAfterMs = 0) {
  const requested = Number(retryAfterMs) || DEFAULT_RATE_LIMIT_PAUSE_MS;
  const pause = Math.max(DEFAULT_RATE_LIMIT_PAUSE_MS, Math.min(MAX_RATE_LIMIT_PAUSE_MS, requested));
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
      const waitMs = Math.max(0, blockedUntil - Date.now(), MIN_GAP_MS - (Date.now() - lastStartedAt));
      if (waitMs > 0) await wait(waitMs);
      lastStartedAt = Date.now();
      try { item.resolve(await item.task()); }
      catch (error) { item.reject(error); }
    }
  } finally {
    running = false;
    if (queue.length) void drain();
  }
}

function wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
