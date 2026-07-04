import { analyzeMatch } from "../core/ai.js";
import { getFootballFixtures } from "../core/api.js";

export async function loadDrawHunterData() {
  const leagues = {
    ligue1: 61,
    laLiga: 140,
    bundesliga: 78,
    premierLeague: 39,
    serieA: 135
  };

  const results = {};

  for (const key in leagues) {
    const data = await getFootballFixtures(leagues[key]);

    results[key] = (data.response || []).slice(0, 5).map(match => {
      return analyzeMatch(match);
    });
  }

  return results;
}
