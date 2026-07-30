import { fetchUpcomingFootballFixtures } from "../core/api/footballService.js";
import { predictDrawMatch } from "../core/engines/footballDrawPredictionEngine.js";
import { computeValue } from "../core/engines/valueEngine.js";
import { CONFIG } from "../core/config/config.js";
import { getBets } from "../core/stores/betsStore.js";

/** SPORTLAB V8 — DRAWHUNTER */
export async function loadDrawHunterMatches() {
  const { fixtures, meta } = await fetchUpcomingFootballFixtures();
  const matches = fixtures.map(match => {
    const prediction = predictDrawMatch(match);
    const odds = estimateDrawOdds(match);
    const value = computeValue({ probability: prediction.probability, odds, minValue: CONFIG.drawhunter.minValue });
    return { ...match, ...prediction, market: "DRAW", odds, ...value };
  });
  const bets = getBets();
  const visibleMatches = matches.filter(match => !bets.some(bet => bet.source === "DrawHunter" && bet.match === `${match.home} vs ${match.away}`));
  return { matches: visibleMatches, meta: { ...meta, visibleTotal: visibleMatches.length, hiddenTotal: matches.length - visibleMatches.length, model: "V8_RECENCY_WEIGHTED_MULTI_SEASON" } };
}
function estimateDrawOdds(){ return 3.1; }
