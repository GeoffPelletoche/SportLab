import { fetchUpcomingFootballFixtures } from "../core/footballService.js";
import { computeValue } from "../core/valueEngine.js";
import { CONFIG } from "../core/config.js";

/**
 * SPORTLAB V3 — DRAWHUNTER MODULE
 * Rôle unique :
 * récupérer les matchs foot à venir et analyser le marché DRAW.
 */

export async function loadDrawHunterMatches() {
  const fixtures = await fetchUpcomingFootballFixtures();

  return fixtures.map(match => {
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
}

/**
 * V1 simple : modèle de probabilité temporaire.
 * Sera amélioré plus tard avec forme récente, H2H, xG, etc.
 */
function estimateDrawProbability(match) {
  return 0.32;
}

/**
 * V1 simple : cote temporaire.
 * Plus tard : récupération odds bookmaker API.
 */
function estimateDrawOdds(match) {
  return 3.1;
}