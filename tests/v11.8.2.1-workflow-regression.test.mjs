import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const workflow = fs.readFileSync(new URL("../.github/workflows/pages.yml", import.meta.url), "utf8");
const pkg = JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"));

test("V11.8.2.8 ships the server-snapshot Pages workflow", () => {
  assert.match(workflow, /name: Deploy SportLab Pages \+ Server Snapshot \(V11\.8\.2\.8\)/);
  assert.match(workflow, /schedule:/);
  assert.match(workflow, /cron: "17 5,12,18 \* \* \*"/);
  assert.match(workflow, /name: Validate SportLab/);
  assert.match(workflow, /run: npm run validate/);
  assert.match(workflow, /name: Build atomic server snapshot/);
  assert.match(workflow, /SPORTLAB_SNAPSHOT_BUILD: "1"/);
  assert.match(workflow, /run: npm run snapshot/);
  assert.ok(workflow.indexOf("Build atomic server snapshot") < workflow.indexOf("Upload artifact"));
});

test("V11.8.2.8 exposes the snapshot build command", () => {
  assert.equal(pkg.version, "11.8.2.8");
  assert.equal(pkg.scripts.snapshot, "node scripts/build-server-snapshot.mjs");
});


test("V11.8.2.8 snapshot build uses a conservative rolling one-minute request window", () => {
  const scheduler = fs.readFileSync(new URL("../core/api/requestScheduler.js", import.meta.url), "utf8");
  assert.match(scheduler, /SNAPSHOT_WINDOW_MS = 60000/);
  assert.match(scheduler, /MIN_GAP_MS = IS_SNAPSHOT_BUILD \? 5000 : 900/);
  assert.match(scheduler, /SNAPSHOT_MAX_STARTS_PER_WINDOW = 10/);
  assert.match(scheduler, /IS_SNAPSHOT_BUILD\) await waitForSnapshotWindow\(\)/);
  assert.match(scheduler, /DEFAULT_RATE_LIMIT_PAUSE_MS = IS_SNAPSHOT_BUILD \? 90000 : 15000/);
  assert.match(scheduler, /MAX_RATE_LIMIT_PAUSE_MS = IS_SNAPSHOT_BUILD \? 180000 : 60000/);
  const client = fs.readFileSync(new URL("../core/api/apiClient.js", import.meta.url), "utf8");
  assert.match(client, /RATE_LIMIT_RETRIES = IS_SNAPSHOT_BUILD \? 3 : 1/);
});
