import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const pages = fs.readFileSync(new URL("../.github/workflows/pages.yml", import.meta.url), "utf8");
const snapshot = fs.readFileSync(new URL("../.github/workflows/server-snapshot.yml", import.meta.url), "utf8");
const pkg = JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"));

test("V11.8.4.10 ships decoupled Pages and server-snapshot workflows", () => {
  assert.match(pages, /name: Deploy SportLab Pages \(V11\.8\.4\.10\)/);
  assert.match(pages, /name: Validate SportLab/);
  assert.doesNotMatch(pages, /Build atomic server snapshot/);
  assert.match(snapshot, /name: Refresh Server Snapshot \(V11\.8\.4\.10\)/);
  assert.match(snapshot, /cron: "17 5,12,18 \* \* \*"/);
  assert.match(snapshot, /name: Build atomic server snapshot/);
  assert.match(snapshot, /SPORTLAB_SNAPSHOT_BUILD: "1"/);
});

test("V11.8.4.10 exposes the snapshot build command", () => {
  assert.equal(pkg.version, "11.8.4.10");
  assert.equal(pkg.scripts.snapshot, "node scripts/build-server-snapshot.mjs");
});

test("V11.8.4.10 snapshot build keeps the conservative rolling one-minute request window", () => {
  const scheduler = fs.readFileSync(new URL("../core/api/requestScheduler.js", import.meta.url), "utf8");
  assert.match(scheduler, /START_WINDOW_MS = 60000/);
  assert.match(scheduler, /MIN_GAP_MS = IS_SNAPSHOT_BUILD \? 5000 : 900/);
  assert.match(scheduler, /MAX_STARTS_PER_WINDOW = 10/);
  assert.match(scheduler, /await waitForStartWindow\(\)/);
  assert.match(scheduler, /DEFAULT_RATE_LIMIT_PAUSE_MS = IS_SNAPSHOT_BUILD \? 90000 : 15000/);
  assert.match(scheduler, /MAX_RATE_LIMIT_PAUSE_MS = IS_SNAPSHOT_BUILD \? 180000 : 60000/);
  const client = fs.readFileSync(new URL("../core/api/apiClient.js", import.meta.url), "utf8");
  assert.match(client, /RATE_LIMIT_RETRIES = IS_SNAPSHOT_BUILD \? 3 : 1/);
});
