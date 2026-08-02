import { fetchUpcomingFootballFixtures } from "../core/api/footballService.js";
import { predictDrawMatch } from "../core/engines/footballDrawPredictionEngine.js";
import { getBets } from "../core/stores/betsStore.js";

/** SPORTLAB V8 — DRAWHUNTER */
export async function loadDrawHunterMatches() {
  const { fixtures, meta } = await fetchUpcomingFootballFixtures();
  const matches = fixtures.map(match => {
    const prediction = predictDrawMatch(match);

    /*
     * V10.1.2 :
     * la cote bookmaker n'est plus simulée.
     * Elle sera saisie manuellement dans DrawHunter, puis la value sera
     * calculée à partir de la probabilité du modèle.
     */
    return {
      ...match,
      ...prediction,
      market: "DRAW",
      odds: null,
      impliedProbability: 0,
      value: 0,
      edge: 0,
      decision: "À ANALYSER",
      fairOdds:
        Number(prediction.probability) > 0
          ? Math.round((1 / Number(prediction.probability)) * 100) / 100
          : null
    };
  });
  const bets = getBets();
  const visibleMatches = matches.filter(match => !bets.some(bet => bet.source === "DrawHunter" && bet.match === `${match.home} vs ${match.away}`));
  return { matches: visibleMatches, meta: { ...meta, visibleTotal: visibleMatches.length, hiddenTotal: matches.length - visibleMatches.length, model: "V8_RECENCY_WEIGHTED_MULTI_SEASON" } };
}
