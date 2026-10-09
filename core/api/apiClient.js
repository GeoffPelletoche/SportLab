import { createRequestReuseCache } from "./requestReuseCache.js";
import { recordRequestReuse, recordBridgeDiagnostics } from "../diagnostics/performanceInstrumentation.js";
import { CONFIG } from "../config/config.js";
import { applyApiCooldown, applyGlobalRateLimit, scheduleApiRequest } from "./requestScheduler.js";

const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_ATTEMPTS = 3;
const IS_SNAPSHOT_BUILD = typeof process !== "undefined" && process?.env?.SPORTLAB_SNAPSHOT_BUILD === "1";
const RATE_LIMIT_RETRIES = IS_SNAPSHOT_BUILD ? 3 : 0;
const requestReuse = createRequestReuseCache();

export async function fetchFromWorker(path, params = {}, options = {}) {
  const url = new URL(CONFIG.api.workerBaseUrl + path);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) url.searchParams.set(key, value);
  });

  url.searchParams.sort();
  const recentFixtures = !IS_SNAPSHOT_BUILD && /\/(?:fixtures|games)$/.test(String(path));
  const cacheKey = url.toString();
  if (recentFixtures && options.forceFresh !== true) {
    const cached = requestReuse.read(cacheKey);
    if (cached) {
      recordRequestReuse("recent", path);
      return { ...cached.value, clientCacheHit: true, clientCacheAgeMs: cached.ageMs, clientVerifiedAt: cached.value.clientVerifiedAt || new Date(Date.now() - cached.ageMs).toISOString() };
    }
  }
  const dedupeKey = `${cacheKey}|${options.timeoutMs || DEFAULT_TIMEOUT_MS}|${options.attempts || DEFAULT_ATTEMPTS}|${options.rateLimitRetries ?? RATE_LIMIT_RETRIES}`;

  const run = async () => {
    const attempts = Math.max(1, Number(options.attempts || DEFAULT_ATTEMPTS));
    const priority = Number(options.priority ?? inferPriority(path));
    let lastError = null;
    let rateLimitRetries = 0;
    const maxRateLimitRetries = options.rateLimitRetries == null ? RATE_LIMIT_RETRIES : Math.max(0, Number(options.rateLimitRetries));

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        const result = await scheduleApiRequest(() => executeRequest(url, options), { priority, path, maxQueueWaitMs: options.maxQueueWaitMs });
        if (result && typeof result === "object") result.clientVerifiedAt = new Date().toISOString();
        if (recentFixtures && Array.isArray(result?.response) && !result?.error) requestReuse.write(cacheKey, result);
        return result;
      } catch (error) {
        lastError = error;
        if (error?.deferred === true) break;
        const status = Number(error?.status || 0);
        if (status === 429 && rateLimitRetries < maxRateLimitRetries) {
          rateLimitRetries += 1;
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

  return requestReuse.run(dedupeKey, run, () => recordRequestReuse("in-flight", path));
}

async function executeRequest(url, options) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(options.timeoutMs || DEFAULT_TIMEOUT_MS));
  try {
    const response = await fetch(url.toString(), {
      headers: { Accept: "application/json" }, signal: controller.signal, cache: "no-store"
    });
    let payload = null;
    try { payload = await response.json(); } catch {
      if (response.status === 429) applyGlobalRateLimit(readRetryAfterMs(response, null), { path: url.pathname });
      const error = new Error(`INVALID_JSON_${response.status}`);
      error.status = response.status;
      throw error;
    }
    // Apply even when the caller has exhausted retries, before the queue advances.
    if (payload?.apiDiagnostics) recordBridgeDiagnostics(url.pathname, payload.apiDiagnostics);
    if (payload?.code === "API_SPORTS_COOLDOWN") applyApiCooldown(readRetryAfterMs(response, payload), { path: url.pathname });
    if (response.status === 429 && payload?.code !== "API_SPORTS_COOLDOWN") applyGlobalRateLimit(readRetryAfterMs(response, payload), { path: url.pathname });
    if (!response.ok) {
      const payloadError = payload?.error;
      const code = payload?.code || (typeof payloadError === "object" ? payloadError?.code : payloadError) || `API_ERROR_${response.status}`;
      const message = payload?.message || (typeof payloadError === "object" ? payloadError?.message : payloadError) || `API_ERROR_${response.status}`;
      const error = new Error(message);
      error.status = response.status;
      error.code = code;
      error.retryAfterMs = readRetryAfterMs(response, payload);
      error.payload = payload;
      error.deferred = payload?.code === "API_SPORTS_COOLDOWN";
      error.url = url.toString();
      throw error;
    }
    return payload;
  } finally { clearTimeout(timeout); }
}

function inferPriority(path) {
  // V11.8.4.2 — Fixture Priority. NFL is a single fixture request and must not
  // sit behind every football/rugby league request at startup. All fixture lists
  // remain strictly ahead of team history requests.
  const value = String(path);
  if (value === "/nfl/games") return 120;
  if (value === "/rugby/fixtures") return 110;
  if (value === "/football/fixtures") return 100;
  if (/\/fixtures$|\/games$/.test(value)) return 90;
  return 0;
}

function readRetryAfterMs(response, payload) {
  const payloadMs = Math.max(0, Number(payload?.retryAfterMs) || 0);
  const header = response.headers?.get?.("Retry-After");
  const seconds = Number(header);
  const retryAt = Date.parse(header || "");
  const headerMs = Number.isFinite(seconds) && seconds > 0 ? seconds * 1000
    : Number.isFinite(retryAt) ? Math.max(0, retryAt - Date.now()) : 0;
  return Math.max(payloadMs, headerMs);
}

export function getDateRange(days) {
  const today = new Date(); const end = new Date(); end.setDate(today.getDate() + days);
  return { from: formatDate(today), to: formatDate(end) };
}
function formatDate(date) { return date.toISOString().split("T")[0]; }
function wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
