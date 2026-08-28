import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const view = fs.readFileSync(new URL("../ui/views/frenchflairView.js", import.meta.url), "utf8");
const config = fs.readFileSync(new URL("../core/config/config.js", import.meta.url), "utf8");

test("FrenchFlair masque les rencontres avec un pari réellement placé", () => {
  assert.match(view, /filter\(match =>/);
  assert.match(view, /getFrenchFlairMatchWorkflow\(match\?\.id\)/);
  assert.match(view, /workflow\?\.placed !== true/);
});

test("Le correctif ne masque pas les NO VALUE sans pari et conserve J+1", () => {
  assert.doesNotMatch(view, /decision.*NO VALUE.*filter/i);
  assert.match(config, /analysisWindowDays:\s*1/);
});
