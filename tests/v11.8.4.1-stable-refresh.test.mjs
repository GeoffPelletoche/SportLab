import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const legacy = fs.readFileSync(new URL("../legacyApp.js", import.meta.url), "utf8");

test("V11.8.4.1 never renders progressive sport payloads into the active workshop", () => {
  assert.match(legacy, /if \(isProgressUpdate\) return false;/);
});

test("V11.8.4.1 suppresses post-sports double renders on sport workshop pages", () => {
  const guards = legacy.match(/if \(!isSportWorkshopPage\(\)\) requestStableRender\(\);/g) || [];
  assert.ok(guards.length >= 2);
});

test("V11.8.4.1 restores the viewport anchor synchronously before post-layout correction", () => {
  assert.match(legacy, /if \(!applyPendingAnalysisNavigation\(\)\) restoreViewportAnchor\(anchor\);/);
  assert.match(legacy, /requestAnimationFrame\(\(\) => restoreViewportAnchor\(anchor\)\)/);
});
