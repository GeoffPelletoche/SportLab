import { CONFIG } from "./config.js";

export async function fetchFromWorker(path, params = {}) {
  const url = new URL(CONFIG.api.workerBaseUrl + path);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, value);
    }
  });

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`API error ${response.status}`);
  }

  return await response.json();
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
