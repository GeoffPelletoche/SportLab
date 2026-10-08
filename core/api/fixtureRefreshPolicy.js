// SPORTLAB V11.8.4.8 — Smart Fixture Refresh
// Avoids repeating an expensive fixture sweep immediately after a successful snapshot.
// Manual refreshes always bypass this policy.
const STARTUP_FIXTURE_COOLDOWN_MS = 10 * 60 * 1000;

export function shouldSkipFixtureRefresh({ previousPayload, refreshMode = "startup", now = Date.now() } = {}) {
  if (refreshMode === "manual" || refreshMode === "force") return false;
  const meta = previousPayload?.meta || {};
  const savedAt = Date.parse(meta.snapshotSavedAt || meta.syncedAt || "");
  if (!Number.isFinite(savedAt)) return false;
  const ageMs = Math.max(0, Number(now) - savedAt);
  if (meta.snapshotStale === true) return false;
  return ageMs < STARTUP_FIXTURE_COOLDOWN_MS;
}

export function fixtureRefreshCooldownMs() { return STARTUP_FIXTURE_COOLDOWN_MS; }
