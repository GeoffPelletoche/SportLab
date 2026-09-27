import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const legacy = fs.readFileSync(new URL("../legacyApp.js", import.meta.url), "utf8");
const drawHunterView = fs.readFileSync(new URL("../ui/views/drawhunterView.js", import.meta.url), "utf8");
const drawHunterWorkflow = fs.readFileSync(new URL("../ui/interactions/drawHunterWorkflow.js", import.meta.url), "utf8");

test("NFL Totals no longer renders a Notes input", () => {
  const start = legacy.indexOf("window.analyzeNflValue");
  const end = legacy.indexOf("window.saveNflAnalysis", start);
  const flow = legacy.slice(start, end);
  assert.doesNotMatch(flow, /id="nfl-notes-/);
  assert.doesNotMatch(flow, /<label>Notes/);
});

test("NFL Totals preserves historical notes without a visible input", () => {
  const start = legacy.indexOf("window.calculateNflAnalysis");
  const end = legacy.indexOf("window.saveNflAnalysis", start);
  const flow = legacy.slice(start, end);
  assert.match(flow, /const notes=getAnalysisForMatch\(match\.id\)\?\.notes\|\|"";/);
  assert.match(flow, /status:"draft",notes,modelVersion/);
});

test("DrawHunter still has no personal Notes input", () => {
  const source = `${drawHunterView}\n${drawHunterWorkflow}`;
  assert.doesNotMatch(source, /Observation personnelle/i);
  assert.doesNotMatch(source, /drawhunter[^\n]{0,80}notes/i);
});
