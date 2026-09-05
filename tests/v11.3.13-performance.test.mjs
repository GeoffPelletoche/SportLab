import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const legacy = fs.readFileSync(new URL("../legacyApp.js", import.meta.url), "utf8");
const render = fs.readFileSync(new URL("../services/renderService.js", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../assets/style.css", import.meta.url), "utf8");

test("V11.3.13 navigation reuses in-memory application data", () => {
  const block = legacy.match(/window\.navigateSportLab = function\(page\) \{[\s\S]*?\n\};/)?.[0] || "";
  assert.match(block, /currentAppData/);
  assert.match(block, /renderCurrentApplication/);
  assert.doesNotMatch(block, /loadApplicationData/);
});

test("V11.3.13 renders only the active heavy view", () => {
  assert.match(render, /Lazy View Rendering/);
  assert.match(render, /if \(activePage === "drawhunter"\)/);
  assert.match(render, /else if \(activePage === "cloud" \|\| activePage === "recovery"\)/);
});

test("V11.3.13 prevents iOS input focus zoom without disabling page zoom", () => {
  assert.match(css, /@supports \(-webkit-touch-callout: none\)/);
  assert.match(css, /font-size: 16px !important/);
  assert.doesNotMatch(css, /user-scalable\s*:\s*no/);
});
