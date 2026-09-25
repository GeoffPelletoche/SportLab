import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const workflow = fs.readFileSync(new URL("../.github/workflows/pages.yml", import.meta.url), "utf8");
const pkg = JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"));

test("V11.8.2.4 ships the server-snapshot Pages workflow", () => {
  assert.match(workflow, /name: Deploy SportLab Pages \+ Server Snapshot \(V11\.8\.2\.4\)/);
  assert.match(workflow, /schedule:/);
  assert.match(workflow, /cron: "17 5,12,18 \* \* \*"/);
  assert.match(workflow, /name: Validate SportLab/);
  assert.match(workflow, /run: npm run validate/);
  assert.match(workflow, /name: Build atomic server snapshot/);
  assert.match(workflow, /SPORTLAB_SNAPSHOT_BUILD: "1"/);
  assert.match(workflow, /run: npm run snapshot/);
  assert.ok(workflow.indexOf("Build atomic server snapshot") < workflow.indexOf("Upload artifact"));
});

test("V11.8.2.4 exposes the snapshot build command", () => {
  assert.equal(pkg.version, "11.8.2.4");
  assert.equal(pkg.scripts.snapshot, "node scripts/build-server-snapshot.mjs");
});


test("V11.8.2.4 snapshot build uses a rolling one-minute request window", () => {
  const scheduler = fs.readFileSync(new URL("../core/api/requestScheduler.js", import.meta.url), "utf8");
  assert.match(scheduler, /SNAPSHOT_WINDOW_MS = 60000/);
  assert.match(scheduler, /SNAPSHOT_MAX_STARTS_PER_WINDOW = 15/);
  assert.match(scheduler, /IS_SNAPSHOT_BUILD\) await waitForSnapshotWindow\(\)/);
  assert.match(scheduler, /DEFAULT_RATE_LIMIT_PAUSE_MS = IS_SNAPSHOT_BUILD \? 75000 : 15000/);
});
