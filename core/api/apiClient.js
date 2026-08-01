import { CONFIG } from "../config/config.js";

const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_ATTEMPTS = 2;

export async function fetchFromWorker(path, params = {}, options = {}) {
  const attempts = Math.max(1, Number(options.attempts || DEFAULT_ATTEMPTS));
  const timeoutMs = Math.max(1000, Number(options.timeoutMs || DEFAULT_TIMEOUT_MS));
  let lastError = null;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const url = new URL(CONFIG.api.workerBaseUrl + path);

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, value);
      }
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url.toString(), {
        signal: controller.signal,
        cache: "no-store"
      });

      let data = null;
      try {
        data = await response.json();
      } catch {
        throw new Error(`Réponse JSON invalide (${response.status})`);
      }

      if (!response.ok) {
        const message = data?.message || data?.error || `API error ${response.status}`;
        throw new Error(String(message));
      }

      return data;
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await new Promise(resolve => setTimeout(resolve, 250 * attempt));
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError || new Error("API indisponible");
}

export function getDateRange(days) {
  const today = new Date();
  const end = new Date();

  end.setDate(today.getDate() + days);

  return {
    from: formatDate(today),
    to: formatDate(end)
  };
}

function formatDate(date) {
  return date.toISOString().split("T")[0];
}
