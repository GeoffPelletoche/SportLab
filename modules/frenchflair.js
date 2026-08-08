import { fetchUpcomingRugbyFixtures } from "../core/api/rugbyService.js";
import { predictRugbyMatch } from "../core/engines/rugbyPredictionEngine.js";

/**
 * SPORTLAB V3 — FRENCHFLAIR MODULE
 * Beta 1.1
 *
 * Fil "À analyser" :
 * - affiche les matchs jamais analysés
 * - affiche les VALUE non placées
 * - masque les NO VALUE
 * - masque les paris placés
 */

export async function loadFrenchFlairMatches() {
  const { fixtures, meta } = await fetchUpcomingRugbyFixtures();

  const predictedMatches = fixtures.map(match => predictRugbyMatch(match));

  /*
   * V11.3.1 : une analyse VALUE ou NO VALUE reste consultable et
   * ré-ouvrable tant que le match n'a pas commencé. Le verrouillage
   * est géré par le workflow/UI à l'heure du coup d'envoi.
   */
  const matches = predictedMatches;

  return {
    matches,
    meta: {
      ...meta,
      visibleTotal: matches.length,
      hiddenTotal: 0
    }
  };
}
