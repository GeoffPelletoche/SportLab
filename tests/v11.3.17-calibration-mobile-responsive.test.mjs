import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const css = await readFile(new URL("../assets/sportlab.css", import.meta.url), "utf8");
const view = await readFile(new URL("../ui/views/calibrationView.js", import.meta.url), "utf8");

test("Calibration mobile guard constrains flex/grid children", () => {
  assert.match(css, /SPORTLAB V11\.3\.17 — CALIBRATION MOBILE RESPONSIVE FIX/);
  assert.match(css, /\.calibration-hero > \*/);
  assert.match(css, /\.calibration-summary-grid > \*/);
  assert.match(css, /min-width:\s*0/);
  assert.match(css, /max-width:\s*100%/);
});

test("Calibration mobile layout stacks metrics and keeps tables locally scrollable", () => {
  assert.match(css, /@media \(max-width:\s*640px\)/);
  assert.match(css, /\.calibration-metrics\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  assert.match(css, /\.calibration-table-wrap\s*\{[\s\S]*?overflow-x:\s*auto/);
  assert.match(css, /-webkit-overflow-scrolling:\s*touch/);
});

test("Calibration view structure remains unchanged by responsive fix", () => {
  assert.match(view, /class="calibration-page sl-page sl-stack sl-stack-lg"/);
  assert.match(view, /class="calibration-hero sl-panel"/);
  assert.match(view, /class="calibration-summary-grid"/);
  assert.match(view, /class="calibration-table-wrap"/);
});
