import { fetchUpcomingRugbyFixtures } from "../core/rugbyService.js";
import { analyzeRugbyMatch } from "../core/rugbyAnalysisEngine.js";

/**
 * 🏉 SPORTLAB V3
 * FRENCHFLAIR MODULE
 *
 * Responsabilité unique :
 * - récupérer les matchs rugby
 * - lancer l'analyse
 * - transmettre les résultats à l'UI
 */

export async function loadFrenchFlairMatches() {

  const { fixtures, meta } = await fetchUpcomingRugbyFixtures();

  const matches = fixtures.map(match => analyzeRugbyMatch(match));

  return {
    matches,
    meta
  };
}