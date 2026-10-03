import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const view = fs.readFileSync(new URL("../ui/views/diagnosticsView.js", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../assets/style.css", import.meta.url), "utf8");
const index = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");

test("Diagnostics keeps the desktop table and renders mobile module cards", () => {
  assert.match(view, /diagnostic-performance-table/);
  assert.match(view, /diagnostic-performance-mobile/);
  assert.match(view, /diagnostic-performance-module/);
  assert.match(view, /<dt>Fixtures<\/dt>/);
  assert.match(view, /<dt>1re analyse<\/dt>/);
  assert.match(view, /<dt>Complet<\/dt>/);
  assert.match(view, /<dt>Analyses<\/dt>/);
});

test("Diagnostics switches to cards on narrow screens", () => {
  assert.match(css, /@media\(max-width:620px\)/);
  assert.match(css, /\.diagnostic-performance-table\{display:none\}/);
  assert.match(css, /\.diagnostic-performance-mobile\{display:grid/);
  assert.match(css, /grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
});

test("V11.8.4.3 cache-busts both app JS and responsive stylesheet", () => {
  assert.match(index, /assets\/style\.css\?v=11\.8\.4/);
  assert.match(index, /app\.js\?v=11\.8\.4/);
});
