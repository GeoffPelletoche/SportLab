import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const panel = fs.readFileSync("core/sync/syncPanel.js", "utf8");
const engine = fs.readFileSync("core/sync/syncEngine.js", "utf8");
const cloudView = fs.readFileSync("ui/views/cloudDashboardView.js", "utf8");

test("V11.7.13 only shows Synchronisation while the engine is actually syncing", () => {
  assert.match(panel, /if \(s\.syncing\) return "syncing"/);
  assert.match(panel, /return s\.lastSyncAt \? "synced"/);
  assert.doesNotMatch(cloudView, /cloud\.syncing \|\| cloud\.lastError/);
  assert.match(cloudView, /if \(cloud\.syncing\)/);
});

test("V11.7.13 publishes a settled cloud-config event after syncing becomes false", () => {
  assert.match(engine, /syncing = false;[\s\S]{0,400}sportlab:cloud-config/);
});
