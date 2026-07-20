import { CONFIG } from "../config/config.js";
import { fetchFromWorker, getDateRange } from "./apiClient.js";

export async function fetchUpcomingFootballFixtures() {
  const range = getDateRange(CONFIG.analysisWindowDays);
  const activeCompetitions = CONFIG.drawhunter.competitions.filter(c => c.active);

  const allFixtures = [];
  const syncLog = [];

  for (const competition of activeCompetitions) {
    try {
      const data = await fetchFromWorker("/football/fixtures", {
        league: competition.id,
        from: range.from,
        to: range.to
      });

      const fixtures = normalizeFootballFixtures(data?.response || [], competition);

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
      sport: "football",
      from: range.from,
      to: range.to,
      competitions: activeCompetitions.length,
      total: allFixtures.length,
      syncedAt: new Date().toISOString(),
      syncLog
    }
  };
}

function normalizeFootballFixtures(items, competition) {
  return items.map(item => ({
    id: item.id,
    home: item.home,
    away: item.away,
    competition: item.competition || competition.name,
    date: item.date,
    source: "DrawHunter",
    sport: "football"
  }));
}
