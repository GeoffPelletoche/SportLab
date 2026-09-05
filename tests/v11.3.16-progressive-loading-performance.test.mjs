import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const legacy = fs.readFileSync(new URL("../legacyApp.js", import.meta.url), "utf8");
const football = fs.readFileSync(new URL("../core/api/footballService.js", import.meta.url), "utf8");
const rugby = fs.readFileSync(new URL("../core/api/rugbyService.js", import.meta.url), "utf8");
const render = fs.readFileSync(new URL("../services/renderService.js", import.meta.url), "utf8");

test("V11.3.16 separates Football and Rugby refresh lifecycles", () => {
  assert.match(legacy, /drawHunterRefreshPromise/);
  assert.match(legacy, /frenchFlairRefreshPromise/);
  assert.match(legacy, /refreshDrawHunterData/);
  assert.match(legacy, /refreshFrenchFlairData/);
});

test("V11.3.16 publishes fixtures before history enrichment", () => {
  assert.match(football, /emitProgress\(onProgress[\s\S]*"fixtures"/);
  assert.match(rugby, /emitProgress\(onProgress[\s\S]*"fixtures"/);
  assert.match(football, /hydrateFixtureFromCache/);
  assert.match(rugby, /hydrateFixtureFromCache/);
});

test("V11.3.16 requests only missing history when cache exists", () => {
  assert.match(football, /fixture\.homeHistory\?\.length \? fixture\.homeHistory : await fetchTeamHistory/);
  assert.match(rugby, /fixture\.homeHistory\?\.length \? fixture\.homeHistory : await fetchTeamHistory/);
});

test("V11.3.16 performance menu route renders the model performance view", () => {
  assert.match(render, /\["diagnostics", "performance", "model-performance", "calibration"\]/);
  assert.match(render, /activePage === "model-performance" \|\| activePage === "performance"/);
});
