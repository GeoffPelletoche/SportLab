import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const legacy = fs.readFileSync(new URL("../legacyApp.js", import.meta.url), "utf8");

test("FrenchFlair requires positive mathematical value before VALUE", () => {
  assert.match(legacy, /const hasPositiveValue\s*=\s*value\.value\s*>=\s*0\.01\s*&&\s*value\.edge\s*>\s*0\s*&&\s*probability\s*>\s*value\.impliedProbability/s);
  assert.match(legacy, /hasPositiveValue\s*&&\s*scoreValue\s*>=\s*70\s*\?\s*"VALUE"\s*:\s*"NO VALUE"/s);
});

test("FrenchFlair score alone cannot override negative value", () => {
  // Screenshot regression: p=63.1%, odds=1.42 => implied ~70.4%, negative value/EV.
  const probability = 0.631;
  const odds = 1.42;
  const impliedProbability = 1 / odds;
  const value = probability - impliedProbability;
  const edge = probability * odds - 1;
  const scoreValue = 72;
  const hasPositiveValue = value >= 0.01 && edge > 0 && probability > impliedProbability;
  const finalDecision = hasPositiveValue && scoreValue >= 70 ? "VALUE" : "NO VALUE";
  assert.equal(finalDecision, "NO VALUE");
  assert.ok(value < 0);
  assert.ok(edge < 0);
});
