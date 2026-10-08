// V11.8.4.12 — Reuse recently verified fixtures across application restarts.
const STARTUP_FRESH_WINDOW_MS = 30 * 60 * 1000;
const STARTUP_EXTENDED_WINDOW_MS = 60 * 60 * 1000;
const UPCOMING_KICKOFF_WINDOW_MS = 24 * 60 * 60 * 1000;
const MANUAL_FRESH_WINDOW_MS = 5 * 60 * 1000;
const NEAR_KICKOFF_WINDOW_MS = 15 * 60 * 1000;
const MANUAL_NEAR_KICKOFF_FRESH_MS = 60 * 1000;

export function shouldSkipFixtureRefresh(options = {}) {
  return fixtureRefreshPolicy(options).action === "skip";
}

export function fixtureRefreshPolicy({ previousPayload, refreshMode = "startup", now = Date.now(), range = null } = {}) {
  if (refreshMode === "force") return { action: "refresh", reason: "forced" };
  const meta = previousPayload?.meta || {};
  // syncedAt is the actual verification time. Saving or displaying a snapshot
  // cannot make its data fresh again; snapshotSavedAt is a legacy fallback only.
  const verifiedAt = Date.parse(meta.fixturesVerifiedAt || meta.syncedAt || meta.snapshotSavedAt || "");
  if (!Number.isFinite(verifiedAt) || verifiedAt > Number(now)) return { action: "refresh", reason: "missing-or-invalid-verification-time" };
  if (meta.snapshotStale === true) return { action: "refresh", reason: "stale-snapshot" };
  if (!Array.isArray(previousPayload?.matches) || meta.error === true || meta.refreshError === true
      || (meta.syncLog || []).some(item => ["ERROR", "RATE_LIMITED"].includes(item.status))) {
    return { action: "refresh", reason: "incomplete-snapshot" };
  }
  if (range && ((meta.from && meta.from !== range.from) || (meta.to && meta.to !== range.to))) {
    return { action: "refresh", reason: "changed-date-range" };
  }
  const ageMs = Number(now) - verifiedAt;
  const matches = previousPayload.matches;
  if (matches.some(match => {
    const kickoff = Date.parse(match?.date || match?.matchDate || "");
    return Number.isFinite(kickoff) && kickoff > verifiedAt && kickoff <= Number(now);
  })) return { action: "refresh", reason: "kickoff-crossed", ageMs };

  if (refreshMode === "manual") {
    const complete = matches.every(match => Array.isArray(match?.homeHistory) && match.homeHistory.length > 0
      && Array.isArray(match?.awayHistory) && match.awayHistory.length > 0);
    if (!complete) return { action: "refresh", reason: "incomplete-analysis-history", ageMs };
    const nearKickoff = hasKnownUpcomingKickoff(previousPayload, now, NEAR_KICKOFF_WINDOW_MS);
    const windowMs = nearKickoff ? MANUAL_NEAR_KICKOFF_FRESH_MS : MANUAL_FRESH_WINDOW_MS;
    return ageMs < windowMs
      ? { action: "skip", reason: "recently-verified-snapshot", ageMs, windowMs }
      : { action: "refresh", reason: nearKickoff ? "near-kickoff" : "manual-snapshot-expired", ageMs, windowMs };
  }
  if (ageMs < STARTUP_FRESH_WINDOW_MS) return { action: "skip", reason: "fresh-snapshot", ageMs };
  if (ageMs < STARTUP_EXTENDED_WINDOW_MS) {
    return hasKnownUpcomingKickoff(previousPayload, now)
      ? { action: "refresh", reason: "upcoming-kickoff", ageMs }
      : { action: "skip", reason: "quiet-window", ageMs };
  }
  return { action: "refresh", reason: "aging-snapshot", ageMs };
}

export function fixtureRefreshWindowMs() {
  return { fresh: STARTUP_FRESH_WINDOW_MS, extended: STARTUP_EXTENDED_WINDOW_MS, kickoff: UPCOMING_KICKOFF_WINDOW_MS,
    manual: MANUAL_FRESH_WINDOW_MS, nearKickoff: NEAR_KICKOFF_WINDOW_MS, manualNearKickoff: MANUAL_NEAR_KICKOFF_FRESH_MS };
}

function hasKnownUpcomingKickoff(payload, now, windowMs = UPCOMING_KICKOFF_WINDOW_MS) {
  const upper = Number(now) + windowMs;
  return (payload?.matches || []).some(match => {
    const kickoff = Date.parse(match?.date || match?.matchDate || "");
    return Number.isFinite(kickoff) && kickoff > Number(now) && kickoff <= upper;
  });
}
