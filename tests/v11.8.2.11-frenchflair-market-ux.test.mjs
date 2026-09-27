import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const legacy = fs.readFileSync(new URL("../legacyApp.js", import.meta.url), "utf8");
const drawHunterView = fs.readFileSync(new URL("../ui/views/drawhunterView.js", import.meta.url), "utf8");
const drawHunterWorkflow = fs.readFileSync(new URL("../ui/interactions/drawHunterWorkflow.js", import.meta.url), "utf8");

test("FrenchFlair defaults a new analysis to the model recommended OVER/UNDER market", () => {
  assert.match(legacy, /const recommendedMarket = match\.recommendedTrend === "UNDER" \? "UNDER" : "OVER";/);
  assert.match(legacy, /const selectedMarket = existing\?\.market === "UNDER" \|\| existing\?\.market === "OVER"/);
  assert.match(legacy, /<option value="OVER" \$\{selectedMarket === "OVER" \? "selected" : ""\}>Over<\/option>/);
  assert.match(legacy, /<option value="UNDER" \$\{selectedMarket === "UNDER" \? "selected" : ""\}>Under<\/option>/);
});

test("FrenchFlair no longer renders the personal notes input but preserves historical notes", () => {
  const ffStart = legacy.indexOf("window.analyzeFrenchFlairValue");
  const ffEnd = legacy.indexOf("window.saveFrenchFlairAnalysis", ffStart);
  const ffFlow = legacy.slice(ffStart, ffEnd);
  assert.doesNotMatch(ffFlow, /id="ff-notes-/);
  assert.doesNotMatch(ffFlow, /Observation personnelle/);
  assert.match(ffFlow, /const notes = getAnalysisForMatch\(match\.id\)\?\.notes \|\| "";/);
});

test("DrawHunter analysis UI has no personal notes field", () => {
  const source = `${drawHunterView}\n${drawHunterWorkflow}`;
  assert.doesNotMatch(source, /Observation personnelle/i);
  assert.doesNotMatch(source, /drawhunter[^\n]{0,80}notes/i);
});
