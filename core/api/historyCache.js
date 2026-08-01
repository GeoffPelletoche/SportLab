const PREFIX = "sportlab.v8.history";
const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30;

function storageAvailable() {
  try {
    return typeof localStorage !== "undefined";
  } catch {
    return false;
  }
}

function buildKey(sport, teamId, leagueId = "all") {
  return `${PREFIX}:${sport}:${leagueId || "all"}:${teamId}`;
}

export function readHistoryCache(sport, teamId, leagueId = "all") {
  if (!storageAvailable() || !teamId) return [];

  try {
    const raw = localStorage.getItem(buildKey(sport, teamId, leagueId));
    if (!raw) return [];

    const payload = JSON.parse(raw);
    const savedAt = Number(payload?.savedAt || 0);
    const matches = Array.isArray(payload?.matches) ? payload.matches : [];

    if (!savedAt || Date.now() - savedAt > MAX_AGE_MS || matches.length === 0) {
      return [];
    }

    return matches;
  } catch {
    return [];
  }
}

export function writeHistoryCache(sport, teamId, leagueId = "all", matches = []) {
  if (!storageAvailable() || !teamId || !Array.isArray(matches) || matches.length === 0) {
    return;
  }

  try {
    localStorage.setItem(
      buildKey(sport, teamId, leagueId),
      JSON.stringify({
        savedAt: Date.now(),
        matches
      })
    );
  } catch (error) {
    console.warn("[HistoryCache] Écriture impossible :", error);
  }
}
