import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const instrumentation = fs.readFileSync(new URL("../core/diagnostics/performanceInstrumentation.js", import.meta.url), "utf8");
const view = fs.readFileSync(new URL("../ui/views/diagnosticsView.js", import.meta.url), "utf8");
const pkg = JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"));

test("V11.8.4.8 performance report advertises the deployed version", () => {
  assert.equal(pkg.version, "11.8.4.8");
  assert.match(instrumentation, /version:\s*"11\.8\.4\.8"/);
  assert.doesNotMatch(instrumentation, /version:\s*"11\.8\.2\.1"/);
});

test("V11.8.4.8 Diagnostics heading is aligned with the report", () => {
  assert.match(view, /V11\.8\.4\.8 — Performance Instrumentation/);
  assert.match(view, /SportLab V11\.8\.4\.8/);
});
