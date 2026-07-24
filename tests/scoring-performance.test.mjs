import test from "node:test";
import assert from "node:assert/strict";
import { scoreAnalysis } from "../core/scoring/unifiedScoringEngine.js";
import { buildModelPerformance } from "../core/performance/modelPerformanceEngine.js";
import { capturePredictionDataset } from "../core/learning/learningDatasetBuilder.js";

test("unified scoring returns bounded confidence and score", () => {
  const result = scoreAnalysis({ id: 1, predictionStatus: "OK", probability: 0.34, home: "A", away: "B", competition: "L1" }, "drawhunter");
  assert.ok(result.confidence >= 0 && result.confidence <= 100);
  assert.ok(result.unifiedScore >= 0 && result.unifiedScore <= 100);
  assert.equal(result.modelVersion, "DH-7.2.0");
});

test("model performance separates modules and computes real ROI", () => {
  const performance = buildModelPerformance([
    { source: "DrawHunter", result: "win", stake: 10, profit: 8, probability: 60 },
    { source: "DrawHunter", result: "loss", stake: 10, profit: -10, probability: 55 },
    { source: "FrenchFlair", result: "win", stake: 5, profit: 4, probability: 70 }
  ]);
  assert.equal(performance.drawhunter.evaluated, 2);
  assert.equal(performance.drawhunter.roi, -10);
  assert.equal(performance.frenchflair.hitRate, 100);
});

test("learning dataset is passive and deduplicated by model version", () => {
  const values = new Map();
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  const payload = { drawhunter: [{ id: "m1", probability: 0.31, home: "A", away: "B", competition: "L1" }], frenchflair: [] };
  assert.equal(capturePredictionDataset(payload, storage).length, 1);
  assert.equal(capturePredictionDataset(payload, storage).length, 1);
});
