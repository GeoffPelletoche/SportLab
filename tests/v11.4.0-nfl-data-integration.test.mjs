import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("V11.4.0 exposes NFL as an independent progressive sport", () => {
  const legacy = read("legacyApp.js");
  assert.match(legacy, /refreshNflData/);
  assert.match(legacy, /loadNflApplicationData/);
  assert.match(legacy, /nflRefreshPromise/);
  assert.match(legacy, /sport:\s*kind === "drawhunter"[\s\S]*"nfl"/);
});

test("V11.4.0 NFL client uses cache-first 30-game history", () => {
  const service = read("core/api/nflService.js");
  assert.match(service, /HISTORY_LIMIT = Number\(CONFIG\.nfl\?\.historyLimit \|\| 30\)/);
  assert.match(service, /readHistoryCache\("nfl"/);
  assert.match(service, /\/nfl\/team-games/);
  assert.match(service, /HISTORY_CONCURRENCY = 2/);
});

test("Bridge 3.11.0 integrates API-NFL without exposing the key", () => {
  const bridge = read("cloudflare-worker/sportlab-api-bridge-v3.11.0.js");
  assert.match(bridge, /const VERSION = "3\.11\.0"/);
  assert.match(bridge, /v1\.american-football\.api-sports\.io\/games/);
  assert.match(bridge, /v1\.american-football\.api-sports\.io\/leagues\?id=1&current=true/);
  assert.match(bridge, /x-apisports-key": env\.API_SPORTS_KEY/);
  assert.match(bridge, /isOfficialNflGame/);
});

test("NFL Sprint 0.1 keeps a dedicated NFL route and view", () => {
  const render = read("services/renderService.js");
  const dashboard = read("ui/views/dashboardView.js");
  const view = read("ui/views/nflView.js");
  assert.match(render, /renderNfl/);
  assert.match(dashboard, /page: "nfl"/);
  assert.match(view, /Sprint 0\.1/);
  assert.doesNotMatch(view, /VALUE OVER|VALUE UNDER/);
});
