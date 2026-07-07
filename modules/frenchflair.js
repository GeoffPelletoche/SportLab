import { fetchUpcomingRugbyFixtures } from "../core/rugbyService.js";
import { predictRugbyMatch } from "../core/rugbyPredictionEngine.js";

/**
 * SPORTLAB V3 — FRENCHFLAIR MODULE
 *
 * Rôle :
 * - récupérer les matchs rugby
 * - enrichir avec l’historique
 * - calculer la prédiction FrenchFlair
 * - transmettre à l’UI
 */

export async function loadFrenchFlairMatches() {
  const { fixtures, meta } = await fetchUpcomingRugbyFixtures();

  const matches = fixtures.map(match => predictRugbyMatch(match));

  return {
    matches,
    meta
  };
}