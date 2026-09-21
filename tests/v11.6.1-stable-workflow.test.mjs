import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const legacy = await readFile(new URL("../legacyApp.js", import.meta.url), "utf8");
const ff = await readFile(new URL("../ui/views/frenchflairView.js", import.meta.url), "utf8");
const nfl = await readFile(new URL("../ui/views/nflView.js", import.meta.url), "utf8");

test("V11.6.1 diffère le rendu pendant une saisie sportive", () => {
  assert.match(legacy, /isProtectedInteractionActive/);
  assert.match(legacy, /deferredRenderRequested = true/);
  assert.match(legacy, /isProgressUpdate && activeSportPage/);
});

test("V11.6.1 prépare la navigation vers l'analyse suivante ou précédente", () => {
  assert.match(legacy, /queueAnalysisNavigation/);
  assert.match(legacy, /cards\.slice\(index \+ 1\)\.find/);
  assert.match(legacy, /cards\.slice\(0, index\)\.reverse\(\)\.find/);
});

test("V11.6.1 rend NO VALUE définitif dans FrenchFlair et NFL Totals", () => {
  assert.match(ff, /workflow\?\.decision[^\n]+NO VALUE/);
  assert.match(nfl, /analysis\?\.finalDecision[^\n]+NO VALUE/);
});
