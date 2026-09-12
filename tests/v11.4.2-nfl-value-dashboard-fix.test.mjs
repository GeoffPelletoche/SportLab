import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const legacy = await readFile(new URL("../legacyApp.js", import.meta.url), "utf8");
const dashboard = await readFile(new URL("../ui/views/dashboardView.js", import.meta.url), "utf8");

test("NFL VALUE exige une value mathématique positive", () => {
  assert.match(legacy, /const hasPositiveValue =\s*value\.value > 0 &&\s*value\.edge > 0 &&\s*probability > value\.impliedProbability/);
  assert.match(legacy, /const finalDecision=hasPositiveValue && scoreValue>=70\?"VALUE":"NO VALUE"/);
});

test("Accueil Premium expose NFL Totals", () => {
  assert.match(dashboard, /title: "NFL Totals"/);
  assert.match(dashboard, /page: "nfl"/);
  assert.match(dashboard, /"🏈", "Analyser la NFL"/);
  assert.match(dashboard, /label: "NFL"/);
});
