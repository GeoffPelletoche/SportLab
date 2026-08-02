import test from "node:test";
import assert from "node:assert/strict";

import {
  explainDrawHunterPrediction
} from "../core/engines/drawHunterExplainabilityEngine.js";

test("V11.1.1 explique une analyse existante sans dépendre de predictionStatus", () => {
  const explanation = explainDrawHunterPrediction({
    probability: 0.34,
    confidence: 78,
    homeStats: {
      games: 16,
      effectiveGames: 13.8,
      drawRate: 0.31,
      lowScoringRate: 0.57,
      averageGoalsFor: 1.2,
      averageGoalsAgainst: 1.1
    },
    awayStats: {
      games: 15,
      effectiveGames: 12.9,
      drawRate: 0.27,
      lowScoringRate: 0.53,
      averageGoalsFor: 1.1,
      averageGoalsAgainst: 1.2
    }
  }, 3.16);

  assert.equal(explanation.available, true);
  assert.equal(explanation.factors.length, 5);
  assert.equal(explanation.fairOdds, 2.94);
});

test("V11.1.1 utilise les indicateurs déjà calculés sans historique brut", () => {
  const explanation = explainDrawHunterPrediction({
    probability: 0.32,
    confidence: 72,
    drawProfile: 0.28,
    lowScoringProfile: 0.61,
    balance: 0.76
  }, null);

  assert.equal(explanation.available, true);
  assert.equal(explanation.factors.some(factor => factor.key === "bookmaker-price"), true);
});

test("V11.1.1 ne rend indisponible que lorsqu'aucun calcul n'existe", () => {
  const explanation = explainDrawHunterPrediction({});
  assert.equal(explanation.available, false);
});
