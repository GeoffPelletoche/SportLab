import { fetchUpcomingNflFixtures } from "../core/api/nflService.js";

// Sprint NFL 0.1 : données uniquement. Aucun modèle VALUE n'est activé ici.
export async function loadNflMatches({ onProgress } = {}) {
  const { fixtures, meta } = await fetchUpcomingNflFixtures({
    onProgress: progress => onProgress?.({ matches: progress.fixtures || [], meta: progress.meta || {} })
  });
  return { matches: fixtures, meta };
}
