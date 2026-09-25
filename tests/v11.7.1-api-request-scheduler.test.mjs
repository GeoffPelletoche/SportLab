import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("V11.7.1 centralizes API-Sports requests and rate-limit recovery", () => {
  const scheduler = fs.readFileSync("core/api/requestScheduler.js", "utf8");
  const client = fs.readFileSync("core/api/apiClient.js", "utf8");
  const legacy = fs.readFileSync("legacyApp.js", "utf8");
  const football = fs.readFileSync("core/api/footballService.js", "utf8");
  const rugby = fs.readFileSync("core/api/rugbyService.js", "utf8");
  const diagnostics = fs.readFileSync("ui/views/diagnosticsView.js", "utf8");
  assert.ok(scheduler.includes("MIN_GAP_MS = IS_SNAPSHOT_BUILD ? 2500 : 900"));
  assert.ok(scheduler.includes("DEFAULT_RATE_LIMIT_PAUSE_MS = IS_SNAPSHOT_BUILD ? 75000 : 15000"));
  assert.match(client, /scheduleApiRequest/);
  assert.match(client, /applyGlobalRateLimit/);
  assert.ok(client.includes("RATE_LIMIT_RETRIES = IS_SNAPSHOT_BUILD ? 2 : 1"));
  assert.match(client, /\/\\\/fixtures\$\|\\\/games\$\//);
  assert.match(legacy, /if \(drawHunterRefreshPromise\) return drawHunterRefreshPromise/);
  assert.match(legacy, /if \(frenchFlairRefreshPromise\) return frenchFlairRefreshPromise/);
  assert.match(legacy, /if \(nflRefreshPromise\) return nflRefreshPromise/);
  assert.match(football, /RATE_LIMITED/);
  assert.match(rugby, /RATE_LIMITED/);
  assert.match(diagnostics, /Différé — limite API/);
});
