import test from "node:test";
import assert from "node:assert/strict";
import { evaluatePendingPredictions } from "../core/performance/predictionEvaluationEngine.js";
import { buildModelPerformance } from "../core/performance/modelPerformanceEngine.js";

function memoryStorage(initial = {}) {
  const data = { ...initial };
  return {
    getItem: key => Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null,
    setItem: (key, value) => { data[key] = String(value); },
    removeItem: key => { delete data[key]; },
    key: index => Object.keys(data)[index] ?? null,
    get length() { return Object.keys(data).length; }
  };
}

test("V11.4.7 normalise la réponse Bridge NFL et évalue un match terminé", async () => {
  const snapshot = {
    id: "nfl:21513",
    moduleId: "nfl",
    matchId: 21513,
    modelVersion: "NFL-TOTALS-11.4.1",
    date: "2026-09-09T20:20:00Z",
    capturedAt: "2026-09-09T10:00:00Z",
    probability: 0.647,
    confidence: 89,
    prediction: "OVER",
    modelDecision: null,
    line: null,
    competition: "NFL",
    features: {
      predictedTotalPoints: 45.2,
      historicalReferenceTotal: 43.5,
      sigma: 12.5
    }
  };

  const storage = memoryStorage({
    "sportlab.v7.learning.dataset": JSON.stringify([snapshot])
  });
  const previousStorage = globalThis.localStorage;
  const previousFetch = globalThis.fetch;
  globalThis.localStorage = storage;
  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    async json() {
      return {
        response: {
          id: 21513,
          status: "FT",
          home: "New England Patriots",
          away: "Seattle Seahawks",
          homeScore: 10,
          awayScore: 13
        }
      };
    }
  });

  try {
    const report = await evaluatePendingPredictions(storage);
    assert.equal(report.checked, 1);
    assert.equal(report.evaluated, 1);
    assert.equal(report.errors, 0);

    const dataset = JSON.parse(storage.getItem("sportlab.v7.learning.dataset"));
    assert.ok(dataset[0].evaluatedAt);
    assert.equal(dataset[0].finalGame.isFinished, true);
    assert.equal(dataset[0].finalGame.homePoints, 10);
    assert.equal(dataset[0].finalGame.awayPoints, 13);
    assert.equal(dataset[0].finalGame.totalPoints, 23);
    assert.equal(dataset[0].result, "LOST");
    assert.equal(dataset[0].decisionQuality, "GOOD_PASS");

    const learning = JSON.parse(storage.getItem("sportlab_learning_v1"));
    assert.equal(learning.length, 1);
    assert.equal(learning[0].moduleId, "nfl");
    assert.equal(learning[0].predictionCorrect, false);
    assert.equal(learning[0].decisionQuality, "GOOD_PASS");
    assert.equal(learning[0].finalScore, "10-13");

    const performance = buildModelPerformance({
      dataset,
      learning,
      bets: [],
      legacy: [],
      analyses: [],
      workflows: {}
    });
    assert.equal(performance.nfl.evaluated, 1);
    assert.equal(performance.nfl.goodPasses, 1);
    assert.equal(performance.nfl.missedOpportunities, 0);
  } finally {
    if (previousStorage === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = previousStorage;
    if (previousFetch === undefined) delete globalThis.fetch;
    else globalThis.fetch = previousFetch;
  }
});

test("V11.4.7 classe une abstention NFL comme opportunité manquée si la préconisation gagne", async () => {
  const snapshot = {
    id: "nfl:999",
    moduleId: "nfl",
    matchId: 999,
    modelVersion: "NFL-TOTALS-11.4.1",
    date: "2026-09-08T20:20:00Z",
    capturedAt: "2026-09-08T10:00:00Z",
    probability: 0.62,
    confidence: 80,
    prediction: "UNDER",
    line: null,
    features: { predictedTotalPoints: 39, historicalReferenceTotal: 44, sigma: 11 }
  };
  const storage = memoryStorage({ "sportlab.v7.learning.dataset": JSON.stringify([snapshot]) });
  const previousStorage = globalThis.localStorage;
  const previousFetch = globalThis.fetch;
  globalThis.localStorage = storage;
  globalThis.fetch = async () => ({ ok: true, status: 200, async json() { return { response: { id:999, status:"AOT", homeScore:17, awayScore:20 } }; } });
  try {
    const report = await evaluatePendingPredictions(storage);
    assert.equal(report.evaluated, 1);
    const learning = JSON.parse(storage.getItem("sportlab_learning_v1"));
    assert.equal(learning[0].decisionQuality, "MISSED_OPPORTUNITY");
  } finally {
    if (previousStorage === undefined) delete globalThis.localStorage; else globalThis.localStorage = previousStorage;
    if (previousFetch === undefined) delete globalThis.fetch; else globalThis.fetch = previousFetch;
  }
});
