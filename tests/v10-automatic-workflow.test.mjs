import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = p => fs.readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("V10 supprime les actions d'archivage des vues", () => {
  assert.equal(read("ui/views/drawhunterView.js").includes('data-dh-action="archive"'), false);
  assert.equal(read("ui/views/frenchflairView.js").includes('data-ff-action="archive"'), false);
});

test("V10 termine vers awaiting_result", () => {
  assert.match(read("ui/interactions/drawHunterWorkflow.js"), /complete:\s*"awaiting_result"/);
  assert.match(read("ui/interactions/frenchFlairWorkflow.js"), /complete:\s*"awaiting_result"/);
});

test("V10 persiste l'évaluation automatique dans le workflow", () => {
  const source = read("core/performance/predictionEvaluationEngine.js");
  assert.match(source, /status:\s*"resulted"/);
  assert.match(source, /GOOD_PASS/);
  assert.match(source, /MISSED_OPPORTUNITY/);
});
