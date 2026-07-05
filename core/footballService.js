import { CONFIG } from "./config.js";
import { fetchFromWorker, getDateRange } from "./apiClient.js";

export async function fetchUpcomingFootballFixtures() {
  const range = getDateRange(CONFIG.analysisWindowDays);
  const activeCompetitions = CONFIG.drawhunter.competitions.filter(c => c.active);

  const allFixtures = [];

  for (const competition of activeCompetitions) {
    try {
      const data = await fetchFromWorker("/football/fixtures", {
        league: competition.id,
        from: range.from,
        to: range.to
      });

      const fixtures = normalizeFootballFixtures(data, competition);

      allFixtures.push(...fixtures);
    } catch (error) {
      console.warn(`Football API error for ${competition.name}:`, error);
    }
  }

  return allFixtures;
}

function normalizeFootballFixtures(data, competition) {
  const response = data?.response || [];

  return response.map(item => ({
    id: item.fixture?.id,
    home: item.teams?.home?.name || "Home",
    away: item.teams?.away?.name || "Away",
    competition: competition.name,
    date: item.fixture?.date || null,
    source: "DrawHunter",
    sport: "football"
  }));
}