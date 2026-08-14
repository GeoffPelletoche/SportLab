import { fetchUpcomingFootballFixtures } from "../core/api/footballService.js";
import { predictDrawMatch } from "../core/engines/footballDrawPredictionEngine.js";

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
  /*
   * V11.3.1 : les rencontres à venir restent accessibles jusqu'au coup
   * d'envoi, même après sauvegarde d'une analyse ou d'une abstention.
   * Le workflow de la carte indique l'état courant et contrôle l'édition.
   */
  return {
    matches,
    meta: {
      ...meta,
      visibleTotal: matches.length,
      hiddenTotal: 0,
      model: "V11_3_4_DRAW_RATE_ANCHORED"
    }
  };
}
