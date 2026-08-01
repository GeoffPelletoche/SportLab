import { CONFIG } from "../config/config.js";

const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_ATTEMPTS = 3;

export async function fetchFromWorker(path, params = {}, options = {}) {
  const url = new URL(CONFIG.api.workerBaseUrl + path);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) url.searchParams.set(key, value);
  });

  const attempts = Math.max(1, Number(options.attempts || DEFAULT_ATTEMPTS));
  let lastError = null;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), Number(options.timeoutMs || DEFAULT_TIMEOUT_MS));
    try {
      const response = await fetch(url.toString(), {
        headers: { Accept: "application/json" },
        signal: controller.signal,
        cache: "no-store"
      });
      let payload = null;
      try { payload = await response.json(); } catch { throw new Error(`INVALID_JSON_${response.status}`); }
      if (!response.ok) throw new Error(payload?.message || payload?.error || `API_ERROR_${response.status}`);
      return payload;
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await wait(350 * attempt);
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError || new Error("WORKER_UNAVAILABLE");
}

export function getDateRange(days) {
  const today = new Date();
  const end = new Date();
  end.setDate(today.getDate() + days);
  return { from: formatDate(today), to: formatDate(end) };
}
function formatDate(date) { return date.toISOString().split("T")[0]; }
function wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
