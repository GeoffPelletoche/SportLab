import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const dashboard = fs.readFileSync(new URL("../ui/views/dashboardView.js", import.meta.url), "utf8");

test("V11.4.10 le dashboard NFL exclut les matchs avec pari placé du compteur à analyser", () => {
  assert.match(dashboard, /const unevaluatedMatches = filterUnevaluatedMatches\(moduleId, matches\)/);
  assert.match(dashboard, /moduleId === "nfl"/);
  assert.match(dashboard, /bet\?\.placed === true/);
  assert.match(dashboard, /String\(bet\?\.matchId \?\? ""\) === String\(match\?\.id \?\? ""\)/);
});
