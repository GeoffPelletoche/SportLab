import test from "node:test";
import assert from "node:assert/strict";
import { prepareWeightedHistory, weightedMean, weightedRate } from "../core/engines/temporalWeightingEngine.js";
import { computeTeamStats } from "../core/engines/rugbyPredictionEngine.js";
import { predictDrawMatch } from "../core/engines/footballDrawPredictionEngine.js";

test("V8 trie les matchs et réduit leur poids avec l'ancienneté", () => {
  const history = [
    { date: "2025-01-01", value: 1 },
    { date: "2026-01-01", value: 2 },
    { date: "2024-01-01", value: 3 }
  ];
  const weighted = prepareWeightedHistory(history);
  assert.equal(weighted[0].value, 2);
  assert.equal(weighted[0].temporalWeight, 1);
  assert.ok(weighted[1].temporalWeight > weighted[2].temporalWeight);
});

test("la moyenne pondérée privilégie le match récent", () => {
  const result = weightedMean([100, 0], [1, 0.4]);
  assert.ok(result > 70);
  assert.equal(weightedRate([{ ok: true, temporalWeight: 1 }, { ok: false, temporalWeight: .4 }], x => x.ok) > .7, true);
});

test("les statistiques rugby acceptent plusieurs saisons", () => {
  const stats = computeTeamStats([
    { date: "2026-07-01", status: "FT", pointsFor: 30, pointsAgainst: 20, isHome: true },
    { date: "2025-09-01", status: "FT", pointsFor: 20, pointsAgainst: 18, isHome: false },
    { date: "2024-09-01", status: "FT", pointsFor: 10, pointsAgainst: 12, isHome: true }
  ]);
  assert.equal(stats.games, 3);
  assert.ok(stats.averageFor > 20);
  assert.ok(stats.effectiveGames > 0);
});

test("DrawHunter produit une probabilité issue des historiques", () => {
  const make = (prefix, draws) => Array.from({ length: 10 }, (_, i) => ({
    date: `2026-0${Math.min(9, i + 1)}-01`, status: "FT",
    goalsFor: i < draws ? 1 : 2,
    goalsAgainst: i < draws ? 1 : 0,
    id: `${prefix}-${i}`
  }));
  const prediction = predictDrawMatch({ homeHistory: make("h", 6), awayHistory: make("a", 5) });
  assert.equal(prediction.predictionStatus, "OK");
  assert.ok(prediction.probability > .28);
});
