import { fetchUpcomingFootballFixtures } from "../core/api/footballService.js";
import { computeValue } from "../core/engines/valueEngine.js";
import { CONFIG } from "../core/config/config.js";
import { getBets } from "../core/stores/betsStore.js";

/**
 * SPORTLAB V3 — DRAWHUNTER MODULE
 * Rôle :
 * récupérer les matchs foot à venir,
 * analyser le marché DRAW,
 * transmettre les métadonnées de synchronisation.
 */

export async function loadDrawHunterMatches() {
  const { fixtures, meta } = await fetchUpcomingFootballFixtures();

  const matches = fixtures.map(match => {
    const probability = estimateDrawProbability(match);
    const odds = estimateDrawOdds(match);

    const value = computeValue({
      probability,
      odds,
      minValue: CONFIG.drawhunter.minValue
    });

    return {
      ...match,
      market: "DRAW",
      odds,
      probability,
      ...value
    };
  });

    const bets = getBets();

  const visibleMatches = matches.filter(match => {
    return !bets.some(bet =>
      bet.source === "DrawHunter" &&
      bet.match === `${match.home} vs ${match.away}`
    );
  });

  return {
    matches: visibleMatches,
    meta: {
      ...meta,
      visibleTotal: visibleMatches.length,
      hiddenTotal: matches.length - visibleMatches.length
    }
  };
}

/**
 * Modèle temporaire V1.
 * Sera remplacé plus tard par les vraies features.
 */
function estimateDrawProbability() {
  return 0.32;
}

/**
 * Cote temporaire V1.
 * Sera remplacée plus tard par l’API odds/bookmakers.
 */
function estimateDrawOdds() {
  return 3.1;
}
