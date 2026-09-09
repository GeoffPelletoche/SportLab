import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = path => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("NFL Totals displays SportLab OVER/UNDER recommendation", async () => {
  const view = await read("ui/views/nflView.js");
  assert.match(view, /Préconisation SportLab/);
  assert.match(view, /recommendedTrend==="UNDER"\?"UNDER":"OVER"/);
  assert.match(view, /historicalReferenceTotal/);
});

test("NFL analysis defaults to model recommendation", async () => {
  const legacy = await read("legacyApp.js");
  assert.match(legacy, /existing\?\.market \|\| \(match\.recommendedTrend === "UNDER" \? "UNDER" : "OVER"\)/);
  assert.match(legacy, /Préconisation SportLab : <strong>\$\{recommendedMarket\}<\/strong>/);
});

test("NFL Data is removed from hamburger navigation while NFL route stays available", async () => {
  const nav = await read("ui/views/navigationView.js");
  const dashboard = await read("ui/views/dashboardView.js");
  assert.doesNotMatch(nav, /label: "NFL Data"/);
  assert.match(dashboard, /Analyser la NFL/);
  assert.match(dashboard, /page: "nfl"/);
});
