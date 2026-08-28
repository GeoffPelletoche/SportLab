import test from "node:test";
import assert from "node:assert/strict";
import { buildModelPerformance } from "../core/performance/modelPerformanceEngine.js";
import { CONFIG } from "../core/config/config.js";

test("V11.3.5 reconstruit les abstentions DrawHunter depuis le workflow réel", () => {
  const performance = buildModelPerformance({
    dataset: [
      { id:"drawhunter:101", matchId:"101", moduleId:"drawhunter", modelVersion:"DH-11.3.4" },
      { id:"drawhunter:102", matchId:"102", moduleId:"drawhunter", modelVersion:"DH-11.3.4" }
    ],
    learning: [
      // Anciennes classifications erronées : le snapshot avait été évalué comme VALUE.
      { learningId:"l101", matchId:"101", moduleId:"drawhunter", evaluatedAt:"x", predictionCorrect:false, eventOccurred:false, decisionQuality:"BAD_VALUE" },
      { learningId:"l102", matchId:"102", moduleId:"drawhunter", evaluatedAt:"x", predictionCorrect:true, eventOccurred:true, decisionQuality:"GOOD_VALUE" }
    ],
    bets: [],
    workflows: {
      drawhunter: {
        "101": { matchId:"101", decision:"NO BET", status:"resulted" },
        "102": { matchId:"102", decision:"NO BET", status:"resulted" }
      },
      frenchflair: {}
    }
  });

  assert.equal(performance.drawhunter.goodPasses, 1);
  assert.equal(performance.drawhunter.missedOpportunities, 1);
  assert.equal(performance.drawhunter.goodValues, 0);
  assert.equal(performance.drawhunter.badValues, 0);
  assert.equal(performance.drawhunter.decisionsEvaluated, 2);
  assert.equal(performance.drawhunter.decisionScore, 50);
});

test("V11.3.6 conserve la fenêtre quotidienne à 1 jour", () => {
  assert.equal(CONFIG.analysisWindowDays, 1);
});
