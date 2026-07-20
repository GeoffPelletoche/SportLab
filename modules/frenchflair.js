import { fetchUpcomingRugbyFixtures } from "../core/api/rugbyService.js";
import { predictRugbyMatch } from "../core/engines/rugbyPredictionEngine.js";
import { getAnalysisForMatch } from "../core/stores/analysisStore.js";

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

  const matches = predictedMatches.filter(match => {
    const analysis = getAnalysisForMatch(match.id);

    // Match jamais analysé → visible
    if (!analysis) return true;

    // Pari placé → masqué
    if (analysis.placed === true || analysis.status === "betPlaced") {
      return false;
    }

    // NO VALUE → masqué
    if (
      analysis.finalDecision === "NO VALUE" ||
      analysis.decision === "NO BET"
    ) {
      return false;
    }

    // VALUE non placée → visible
    return true;
  });

  return {
    matches,
    meta: {
      ...meta,
      visibleTotal: matches.length,
      hiddenTotal: predictedMatches.length - matches.length
    }
  };
}
