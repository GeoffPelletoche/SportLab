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

      const raw = Array.isArray(data?.response) ? data.response : [];
      const fixtures = normalizeRugbyFixtures(raw, competition, data);

      allFixtures.push(...fixtures);

      syncLog.push({
        competition: competition.name,
        leagueId: competition.id,
        season: data?.season || null,
        status: data?.rawErrors && Object.keys(data.rawErrors).length ? "API_ERROR" : "OK",
        source: data?.source || "unknown",
        count: fixtures.length,
        rawResults: data?.rawResults ?? null,
        message: data?.warning || null
      });

    } catch (error) {
      syncLog.push({
        competition: competition.name,
        leagueId: competition.id,
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

function normalizeRugbyFixtures(items, competition, data) {
  return items.map(item => ({
    id: item.id,
    home: item.home,
    away: item.away,
    competition: item.competition || competition.name,
    date: item.date,
    status: item.status,
    leagueId: item.leagueId || competition.id,
    season: item.season || data?.season || null,
    source: "FrenchFlair",
    sport: "rugby",

    homeAvgFor: null,
    homeAvgAgainst: null,
    awayAvgFor: null,
    awayAvgAgainst: null
  }));
}