import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("V11.8.0 instruments scheduler without relaxing anti-429 gap", () => {
  const src=fs.readFileSync("core/api/requestScheduler.js","utf8");
  assert.match(src,/MIN_GAP_MS = IS_SNAPSHOT_BUILD \? 5000 : 900/);
  assert.match(src,/recordSchedulerEnqueue/);
  assert.match(src,/recordRateLimit/);
});
test("V11.8.0 measures first fixtures, first analysis and completion", () => {
  const src=fs.readFileSync("core/diagnostics/performanceInstrumentation.js","utf8");
  assert.match(src,/firstFixturesMs/); assert.match(src,/firstAnalysisMs/); assert.match(src,/completeMs/);
});
test("V11.8.0 exposes a copyable report in Diagnostics", () => {
  const view=fs.readFileSync("ui/views/diagnosticsView.js","utf8");
  const runtime=fs.readFileSync("legacyApp.js","utf8");
  assert.match(view,/copy-performance-diagnostic/); assert.match(runtime,/formatPerformanceReport/);
});
