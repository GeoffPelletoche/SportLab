import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("V11.8.4.2 gives NFL fixtures highest startup priority", () => {
  const api = read("core/api/apiClient.js");
  assert.ok(api.includes('if (value === "/nfl/games") return 120'));
  assert.ok(api.includes('if (value === "/rugby/fixtures") return 110'));
  assert.ok(api.includes('if (value === "/football/fixtures") return 100'));
});

test("V11.8.4.2 starts NFL refresh before rugby and football", () => {
  const app = read("legacyApp.js");
  const nfl = app.indexOf('void refreshNflData({ force: forceSports');
  const rugby = app.indexOf('void refreshFrenchFlairData({ force: forceSports');
  const football = app.indexOf('void refreshDrawHunterData({ force: forceSports');
  assert.ok(nfl >= 0 && nfl < rugby && rugby < football);
});

test("V11.8.4.3 removes the regressive browser rolling window", () => {
  const scheduler = read("core/api/requestScheduler.js");
  assert.match(scheduler, /if \(IS_SNAPSHOT_BUILD\) await waitForStartWindow\(\)/);
  assert.match(scheduler, /MIN_GAP_MS = IS_SNAPSHOT_BUILD \? 5000 : 900/);
});

test("V11.8.4.2 dashboard does not call a snapshot up to date", () => {
  const dashboard = read("ui/views/dashboardView.js");
  assert.match(dashboard, /isSnapshot/);
  assert.match(dashboard, /Dernier snapshot disponible/);
  assert.match(dashboard, /Dernières données/);
});

test("V11.8.4.2 exposes NFL fixture request diagnostics", () => {
  const nfl = read("core/api/nflService.js");
  const diagnostics = read("ui/views/diagnosticsView.js");
  const render = read("services/renderService.js");
  assert.match(nfl, /fixtureRequest/);
  assert.match(diagnostics, /Requête fixtures/);
  assert.match(diagnostics, /NFL Totals/);
  assert.match(render, /nflMeta: data\.nflPayload/);
});
