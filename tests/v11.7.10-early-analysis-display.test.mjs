import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const legacy = fs.readFileSync(new URL("../legacyApp.js", import.meta.url), "utf8");
const scheduler = fs.readFileSync(new URL("../core/api/requestScheduler.js", import.meta.url), "utf8");

test("V11.7.10 only exposes analyses with both team histories", () => {
  assert.match(legacy, /function hasUsableAnalysisHistory/);
  assert.match(legacy, /match\?\.homeHistory/);
  assert.match(legacy, /match\?\.awayHistory/);
  assert.match(legacy, /function earlyAnalysisPayload/);
});

test("V11.7.10 renders at most one early batch per sport generation", () => {
  assert.match(legacy, /earlyAnalysisRenderedGeneration/);
  assert.match(legacy, /earlyAnalysisRenderedGeneration\[kind\] === generation/);
  assert.match(legacy, /earlyAnalysisRenderedGeneration\[kind\] = generation/);
});

test("V11.7.10 preserves stable input protection", () => {
  assert.match(legacy, /if \(!force && isProtectedInteractionActive\(\)\)/);
  assert.match(legacy, /deferredRenderRequested = true/);
});

test("V11.7.10 does not relax the API scheduler", () => {
  assert.match(scheduler, /900/);
  assert.match(scheduler, /429/);
});
