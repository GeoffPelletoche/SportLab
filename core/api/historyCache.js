const PREFIX = "sportlab.v9.history";
const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 21;

export function readHistoryCache(sport, teamId) {
  try {
    const item = JSON.parse(localStorage.getItem(keyOf(sport, teamId)) || "null");
    if (!item || !Array.isArray(item.history) || !item.history.length) return [];
    if (Date.now() - Number(item.savedAt || 0) > MAX_AGE_MS) return [];
    return item.history;
  } catch { return []; }
}

export function writeHistoryCache(sport, teamId, history) {
  if (!teamId || !Array.isArray(history) || !history.length) return;
  try {
    localStorage.setItem(keyOf(sport, teamId), JSON.stringify({ savedAt: Date.now(), history }));
  } catch (error) { console.warn("[HistoryCache] Écriture impossible", error); }
}

function keyOf(sport, teamId) { return `${PREFIX}.${sport}.${teamId}`; }
