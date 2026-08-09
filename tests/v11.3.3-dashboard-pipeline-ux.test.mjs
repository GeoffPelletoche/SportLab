import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const dh = fs.readFileSync(new URL("../ui/views/drawhunterView.js", import.meta.url), "utf8");
const dash = fs.readFileSync(new URL("../ui/views/dashboardView.js", import.meta.url), "utf8");

test("DrawHunter pipeline uses normalized workflow states", () => {
  assert.match(dh, /state === "awaiting_result"/);
  assert.match(dh, /const completed = awaitingResult \+ resulted \+ archived/);
  assert.doesNotMatch(dh, /count: stats\.analyzed/);
  assert.doesNotMatch(dh, /dh-hero__scoreboard/);
  assert.doesNotMatch(dh, /dh-workspace__summary/);
});

test("Dashboard removes redundant priorities, overview and VALUE counters", () => {
  const premiumHome = dash.slice(dash.indexOf("function renderPremiumHome"), dash.indexOf("/* =========================================================\n   HERO"));
  assert.doesNotMatch(premiumHome, /renderPriorityStrip/);
  assert.doesNotMatch(premiumHome, /renderOverview/);
  assert.doesNotMatch(dash.slice(dash.indexOf("function renderHero"), dash.indexOf("function renderHeroMetric")), /VALUE/);
  assert.match(dash, /return `\$\{formatInteger\(totals\.matches\)\} matchs sont disponibles\.`/);
});

test("Dashboard module pending count is driven by workflow state", () => {
  assert.match(dash, /deriveDrawHunterWorkflowState/);
  assert.match(dash, /deriveFrenchFlairWorkflowState/);
  assert.match(dash, /\["new", "pending"\]\.includes\(state\)/);
  assert.match(dash, /renderModuleStat\(stats\.pending, "À analyser"\)/);
});
