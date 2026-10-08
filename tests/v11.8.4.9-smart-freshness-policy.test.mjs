import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { shouldSkipFixtureRefresh, fixtureRefreshPolicy } from "../core/api/fixtureRefreshPolicy.js";

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const base = now => ({ meta: { syncedAt: new Date(now - 20 * 60 * 1000).toISOString(), snapshotStale: false }, matches: [] });

test("V11.8.4.9 skips a fresh startup snapshot under 30 minutes", () => {
  const now = Date.parse("2026-10-08T12:00:00Z");
  assert.equal(shouldSkipFixtureRefresh({ previousPayload: base(now), now }), true);
  assert.equal(fixtureRefreshPolicy({ previousPayload: base(now), now }).reason, "fresh-snapshot");
});

test("V11.8.4.9 bypasses freshness policy for manual refresh and stale snapshots", () => {
  const now = Date.parse("2026-10-08T12:00:00Z");
  assert.equal(shouldSkipFixtureRefresh({ previousPayload: base(now), refreshMode: "manual", now }), false);
  assert.equal(shouldSkipFixtureRefresh({ previousPayload: { ...base(now), meta: { ...base(now).meta, snapshotStale: true } }, now }), false);
});

test("V11.8.4.9 uses known upcoming kickoffs during the 30–60 minute window", () => {
  const now = Date.parse("2026-10-08T12:00:00Z");
  const quiet = { meta: { syncedAt: new Date(now - 45 * 60 * 1000).toISOString(), snapshotStale: false }, matches: [] };
  const upcoming = { ...quiet, matches: [{ date: "2026-10-08T20:00:00Z" }] };
  assert.equal(fixtureRefreshPolicy({ previousPayload: quiet, now }).reason, "quiet-window");
  assert.equal(shouldSkipFixtureRefresh({ previousPayload: quiet, now }), true);
  assert.equal(fixtureRefreshPolicy({ previousPayload: upcoming, now }).reason, "upcoming-kickoff");
  assert.equal(shouldSkipFixtureRefresh({ previousPayload: upcoming, now }), false);
});

test("V11.8.4.9 refreshes automatically once the snapshot is over one hour old", () => {
  const now = Date.parse("2026-10-08T12:00:00Z");
  const payload = { meta: { syncedAt: new Date(now - 61 * 60 * 1000).toISOString(), snapshotStale: false }, matches: [] };
  assert.equal(fixtureRefreshPolicy({ previousPayload: payload, now }).reason, "aging-snapshot");
  assert.equal(shouldSkipFixtureRefresh({ previousPayload: payload, now }), false);
});

test("V11.8.4.9 services expose the freshness decision in cooldown diagnostics", () => {
  for (const file of ["core/api/nflService.js", "core/api/rugbyService.js", "core/api/footballService.js"]) {
    const source = read(file);
    assert.match(source, /fixtureRefreshPolicy/);
    assert.match(source, /fixtureRefreshReason: freshness\.reason/);
    assert.match(source, /fixtureRefreshPolicy: freshness/);
  }
});
