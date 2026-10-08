// SPORTLAB V11.8.4.9 — Smart Freshness Policy
// Snapshot-first startup policy: avoid needless fixture sweeps while still
// refreshing aggressively when a snapshot is aging or a known kickoff is near.
const STARTUP_FRESH_WINDOW_MS = 30 * 60 * 1000;
const STARTUP_EXTENDED_WINDOW_MS = 60 * 60 * 1000;
const UPCOMING_KICKOFF_WINDOW_MS = 24 * 60 * 60 * 1000;

export function shouldSkipFixtureRefresh({ previousPayload, refreshMode = "startup", now = Date.now() } = {}) {
  if (refreshMode === "manual" || refreshMode === "force") return false;
  const meta = previousPayload?.meta || {};
  const savedAt = Date.parse(meta.snapshotSavedAt || meta.syncedAt || "");
  if (!Number.isFinite(savedAt)) return false;
  if (meta.snapshotStale === true) return false;

  const ageMs = Math.max(0, Number(now) - savedAt);
  if (ageMs < STARTUP_FRESH_WINDOW_MS) return true;

  // Between 30 and 60 minutes, only refresh automatically when the snapshot
  // already contains a known kickoff in the next 24h. This avoids an expensive
  // full sweep on a quiet window while remaining responsive near match time.
  if (ageMs < STARTUP_EXTENDED_WINDOW_MS) {
    return !hasKnownUpcomingKickoff(previousPayload, now);
  }

  return false;
}

export function fixtureRefreshPolicy({ previousPayload, refreshMode = "startup", now = Date.now() } = {}) {
  if (refreshMode === "manual" || refreshMode === "force") return { action: "refresh", reason: "manual" };
  const meta = previousPayload?.meta || {};
  const savedAt = Date.parse(meta.snapshotSavedAt || meta.syncedAt || "");
  if (!Number.isFinite(savedAt)) return { action: "refresh", reason: "missing-snapshot-time" };
  if (meta.snapshotStale === true) return { action: "refresh", reason: "stale-snapshot" };

  const ageMs = Math.max(0, Number(now) - savedAt);
  if (ageMs < STARTUP_FRESH_WINDOW_MS) return { action: "skip", reason: "fresh-snapshot", ageMs };
  if (ageMs < STARTUP_EXTENDED_WINDOW_MS) {
    return hasKnownUpcomingKickoff(previousPayload, now)
      ? { action: "refresh", reason: "upcoming-kickoff", ageMs }
      : { action: "skip", reason: "quiet-window", ageMs };
  }
  return { action: "refresh", reason: "aging-snapshot", ageMs };
}

export function fixtureRefreshWindowMs() {
  return { fresh: STARTUP_FRESH_WINDOW_MS, extended: STARTUP_EXTENDED_WINDOW_MS, kickoff: UPCOMING_KICKOFF_WINDOW_MS };
}

function hasKnownUpcomingKickoff(payload, now) {
  const matches = Array.isArray(payload?.matches) ? payload.matches : [];
  const upper = Number(now) + UPCOMING_KICKOFF_WINDOW_MS;
  return matches.some(match => {
    const kickoff = Date.parse(match?.date || match?.matchDate || "");
    return Number.isFinite(kickoff) && kickoff > Number(now) && kickoff <= upper;
  });
}
