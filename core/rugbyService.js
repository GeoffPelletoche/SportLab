import { CONFIG } from "./config.js";
import { fetchFromWorker, getDateRange } from "./apiClient.js";

export async function fetchUpcomingRugbyFixtures() {
  const range = getDateRange(CONFIG.analysisWindowDays);
  const activeCompetitions = CONFIG.frenchflair.competitions.filter(c => c.active);

  const allFixtures = [];
  const syncLog = [];

  for (const competition of activeCompetitions) {
    try {
      const data = await fetchFromWorker("/rugby/fixtures", {
        league: competition.id,
        from: range.from,
        to: range.to
      });

      const fixtures = normalizeRugbyFixtures(data?.response || [], competition);

      allFixtures.push(...fixtures);

      syncLog.push({
        competition: competition.name,
        status: "OK",
        source: data?.source || "unknown",
        count: fixtures.length
      });

    } catch (error) {
      syncLog.push({
        competition: competition.name,
        status: "ERROR",
        source: "api",
        count: 0,
        message: error.message
      });
    }
  }

  return {
    fixtures: allFixtures,
    meta: {
      sport: "rugby",
      from: range.from,
      to: range.to,
      competitions: activeCompetitions.length,
      total: allFixtures.length,
      syncedAt: new Date().toISOString(),
      syncLog
    }
  };
}

function normalizeRugbyFixtures(data, competition) {
  return data.map(item => ({
    id: item.id,
    home: item.home,
    away: item.away,
    competition: item.competition || competition.name,
    date: item.date,
    status: item.status,
    source: "FrenchFlair",
    sport: "rugby",

    // Données temporaires en attendant l’historique API
    homeAvgFor: 24,
    homeAvgAgainst: 22,
    awayAvgFor: 23,
    awayAvgAgainst: 23
  }));
}