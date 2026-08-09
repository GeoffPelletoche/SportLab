import test from "node:test";
import assert from "node:assert/strict";
import { buildModelPerformance } from "../core/performance/modelPerformanceEngine.js";

test("V11.3.2 uses learning records for evaluated predictions and bets for ROI", () => {
  const performance = buildModelPerformance({
    dataset: [
      { id:"d1", moduleId:"drawhunter", modelVersion:"DH" },
      { id:"d2", moduleId:"drawhunter", modelVersion:"DH" },
      { id:"f1", moduleId:"frenchflair", modelVersion:"FF" }
    ],
    learning: [
      { learningId:"d1", moduleId:"drawhunter", evaluatedAt:"x", predictionCorrect:true, probability:.34, decisionQuality:"GOOD_VALUE" },
      { learningId:"d2", moduleId:"drawhunter", evaluatedAt:"x", predictionCorrect:false, probability:.32, decisionQuality:"GOOD_PASS" },
      { learningId:"f1", moduleId:"frenchflair", evaluatedAt:"x", predictionCorrect:true, probability:.70, decisionQuality:"MISSED_OPPORTUNITY" }
    ],
    bets: [
      { id:"b1", source:"DrawHunter", placed:true, result:"WON", stake:10, odds:3 },
      { id:"b2", source:"DrawHunter", placed:true, result:"LOST", stake:10, odds:2 }
    ]
  });
  assert.equal(performance.drawhunter.predictions, 2);
  assert.equal(performance.drawhunter.evaluated, 2);
  assert.equal(performance.drawhunter.hitRate, 50);
  assert.equal(performance.drawhunter.settledBets, 2);
  assert.equal(performance.drawhunter.profit, 10);
  assert.equal(performance.drawhunter.roi, 50);
  assert.equal(performance.drawhunter.goodPasses, 1);
  assert.equal(performance.frenchflair.evaluated, 1);
});
