import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("V11.8.4.6 renders DrawHunter placed bets as waiting", () => {
  const store = read("core/stores/drawHunterWorkflowStore.js");
  const view = read("ui/views/drawhunterView.js");
  assert.match(store, /normalized === "awaiting_result" && stored\?\.placed === true/);
  assert.match(view, /statusLabel\(workflowState, storedWorkflow\)/);
  assert.match(view, /const placed = storedWorkflow\?\.placed === true/);
  assert.match(view, /value="\$\{stake > 0 \? stake\.toFixed\(2\) : ""\}"/);
});

test("V11.8.4.6 keeps fixture retries but disables 429 retries for histories", () => {
  const api = read("core/api/apiClient.js");
  const football = read("core/api/footballService.js");
  const rugby = read("core/api/rugbyService.js");
  const nfl = read("core/api/nflService.js");
  assert.match(api, /options\.rateLimitRetries == null \? RATE_LIMIT_RETRIES/);
  assert.match(football, /rateLimitRetries: 0/);
  assert.match(rugby, /rateLimitRetries: 0/);
  assert.match(nfl, /rateLimitRetries: 0/);
});

test("V11.8.4.6 accepts soft-stale snapshots only as bootstrap", () => {
  const local = read("core/api/sportsSnapshotStore.js");
  const server = read("core/api/serverSportsSnapshot.js");
  assert.match(local, /MAX_BOOTSTRAP_STALE_MS = 14 \* 24 \* 60 \* 60 \* 1000/);
  assert.match(local, /snapshotStale: snapshot\.stale === true/);
  assert.match(server, /MAX_BOOTSTRAP_STALE_MS = 14 \* 24 \* 60 \* 60 \* 1000/);
  assert.match(server, /snapshotStale: snapshot\.stale === true/);
});

test("V11.8.4.6 diagnostics expose fixture-ready and reuse metrics", () => {
  const perf = read("core/diagnostics/performanceInstrumentation.js");
  const view = read("ui/views/diagnosticsView.js");
  assert.match(perf, /fixturesReadyMs/);
  assert.match(perf, /reusedMatches/);
  assert.match(perf, /historyRequests/);
  assert.match(view, /Fixtures prêtes/);
  assert.match(view, /Réutilisés/);
  assert.match(view, /Historiques/);
});
