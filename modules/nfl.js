import { fetchUpcomingNflFixtures } from "../core/api/nflService.js";
import { predictNflMatch } from "../core/engines/nflTotalsPredictionEngine.js";

export async function loadNflMatches({ onProgress, previousMatches = [], previousPayload = null, refreshMode = "startup" } = {}) {
  const { fixtures, meta } = await fetchUpcomingNflFixtures({
    previousMatches,
    previousPayload,
    refreshMode,
    onProgress: progress => onProgress?.({
      matches: (progress.fixtures || []).map(match => predictNflMatch(match)),
      meta: progress.meta || {}
    })
  });
  return { matches: fixtures.map(match => predictNflMatch(match)), meta };
}
