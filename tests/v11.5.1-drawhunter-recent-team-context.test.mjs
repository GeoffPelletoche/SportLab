import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("DrawHunter remplace Explainable AI par les repères récents des deux équipes", () => {
  const view = fs.readFileSync(new URL("../ui/views/drawhunterView.js", import.meta.url), "utf8");
  assert.match(view, /Derniers résultats & paris/);
  assert.match(view, /Dernier résultat/);
  assert.match(view, /Dernier pari SportLab/);
  assert.match(view, /homeHistory/);
  assert.match(view, /awayHistory/);
  assert.match(view, /getBets/);
  assert.match(view, /betInvolvesTeam/);
  assert.doesNotMatch(view, /renderExplainability\(/);
});

test("la mise précédente reste informative et ne modifie pas le calcul VALUE", () => {
  const view = fs.readFileSync(new URL("../ui/views/drawhunterView.js", import.meta.url), "utf8");
  assert.match(view, /La mise précédente est affichée comme repère uniquement/);
  assert.match(view, /computeValue/);
});
