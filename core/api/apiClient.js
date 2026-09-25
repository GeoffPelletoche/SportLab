import { CONFIG } from "../config/config.js";
import { applyGlobalRateLimit, scheduleApiRequest } from "./requestScheduler.js";

const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_ATTEMPTS = 3;
const IS_SNAPSHOT_BUILD = typeof process !== "undefined" && process?.env?.SPORTLAB_SNAPSHOT_BUILD === "1";
const RATE_LIMIT_RETRIES = IS_SNAPSHOT_BUILD ? 3 : 1;
const snapshotInFlight = new Map();

export async function fetchFromWorker(path, params = {}, options = {}) {
  const url = new URL(CONFIG.api.workerBaseUrl + path);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) url.searchParams.set(key, value);
  });

  const dedupeKey = IS_SNAPSHOT_BUILD && /\/team-(?:games|fixtures)$/.test(String(path)) ? url.toString() : null;
  if (dedupeKey && snapshotInFlight.has(dedupeKey)) return snapshotInFlight.get(dedupeKey);

  const run = async () => {
    const attempts = Math.max(1, Number(options.attempts || DEFAULT_ATTEMPTS));
    const priority = Number(options.priority ?? inferPriority(path));
    let lastError = null;
    let rateLimitRetries = 0;

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        return await scheduleApiRequest(() => executeRequest(url, options), { priority });
      } catch (error) {
        lastError = error;
        const status = Number(error?.status || 0);
        if (status === 429 && rateLimitRetries < RATE_LIMIT_RETRIES) {
          rateLimitRetries += 1;
          applyGlobalRateLimit(error?.retryAfterMs);
          attempt -= 1;
          continue;
        }
        const retryable = ![400, 401, 403, 404, 409, 422, 429].includes(status);
        if (attempt < attempts && retryable) await wait(Math.min(2500, 500 * attempt));
        else break;
      }
    }
    throw lastError || new Error("WORKER_UNAVAILABLE");
  };

  if (!dedupeKey) return run();
  const promise = run().finally(() => snapshotInFlight.delete(dedupeKey));
  snapshotInFlight.set(dedupeKey, promise);
  return promise;
}

async function executeRequest(url, options) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(options.timeoutMs || DEFAULT_TIMEOUT_MS));
  try {
    const response = await fetch(url.toString(), {
      headers: { Accept: "application/json" }, signal: controller.signal, cache: "no-store"
    });
    let payload = null;
    try { payload = await response.json(); } catch { throw new Error(`INVALID_JSON_${response.status}`); }
    if (!response.ok) {
      const payloadError = payload?.error;
      const code = payload?.code || (typeof payloadError === "object" ? payloadError?.code : payloadError) || `API_ERROR_${response.status}`;
      const message = payload?.message || (typeof payloadError === "object" ? payloadError?.message : payloadError) || `API_ERROR_${response.status}`;
      const error = new Error(message);
      error.status = response.status;
      error.code = code;
      error.retryAfterMs = readRetryAfterMs(response, payload);
      error.payload = payload;
      error.url = url.toString();
      throw error;
    }
    return payload;
  } finally { clearTimeout(timeout); }
}

function inferPriority(path) {
  // Les listes de rencontres utiles à l'écran passent avant les historiques.
  return /\/fixtures$|\/games$/.test(String(path)) ? 10 : 0;
}

function readRetryAfterMs(response, payload) {
  const payloadMs = Number(payload?.retryAfterMs || 0);
  if (payloadMs > 0) return payloadMs;
  const header = response.headers?.get?.("Retry-After");
  const seconds = Number(header);
  if (Number.isFinite(seconds) && seconds > 0) return seconds * 1000;
  return 0;
}

export function getDateRange(days) {
  const today = new Date(); const end = new Date(); end.setDate(today.getDate() + days);
  return { from: formatDate(today), to: formatDate(end) };
}
function formatDate(date) { return date.toISOString().split("T")[0]; }
function wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
