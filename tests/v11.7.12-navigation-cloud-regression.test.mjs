import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const legacy = fs.readFileSync("legacyApp.js", "utf8");
const panel = fs.readFileSync("core/sync/syncPanel.js", "utf8");
const cloudView = fs.readFileSync("ui/views/cloudDashboardView.js", "utf8");

test("V11.7.12 dashboard module buttons do not activate analysis render lock", () => {
  assert.doesNotMatch(legacy, /pointerdown[\s\S]{0,300}\[data-module=\"drawhunter\"\]/);
  assert.match(legacy, /pointerdown[\s\S]{0,300}\[data-match-id\] input/);
  assert.match(legacy, /closest\?\.\('\[data-match-id\]'\)/);
  assert.match(legacy, /window\.navigateSportLab = function\(page\)/);
});

test("V11.7.12 transient cloud errors remain a recovery state", () => {
  assert.match(panel, /hardFailure \? "error" : "syncing"/);
  assert.match(cloudView, /cloud\.syncing \|\| cloud\.lastError/);
  assert.match(cloudView, /cloud\.lastError && hardFailure/);
});
