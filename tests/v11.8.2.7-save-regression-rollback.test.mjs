import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const legacyApp = fs.readFileSync(new URL("../legacyApp.js", import.meta.url), "utf8");

test("V11.8.2.10 removes the V11.8.2.6 server snapshot diagnostic from the normal app path", () => {
  assert.doesNotMatch(legacyApp, /serverSnapshotTest/);
  assert.doesNotMatch(legacyApp, /isServerSnapshotDiagnosticMode/);
  assert.doesNotMatch(legacyApp, /server-snapshot-test/);
});
