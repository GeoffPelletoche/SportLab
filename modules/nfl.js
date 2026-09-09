import { fetchUpcomingNflFixtures } from "../core/api/nflService.js";
import { predictNflMatch } from "../core/engines/nflTotalsPredictionEngine.js";

export async function loadNflMatches({ onProgress } = {}) {
  const { fixtures, meta } = await fetchUpcomingNflFixtures({
    onProgress: progress => onProgress?.({
      matches: (progress.fixtures || []).map(match => predictNflMatch(match)),
      meta: progress.meta || {}
    })
  });
  return { matches: fixtures.map(match => predictNflMatch(match)), meta };
}
