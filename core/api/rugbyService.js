import { CONFIG } from "./config.js";
import { fetchFromWorker, getDateRange } from "./apiClient.js";

const HISTORY_LIMIT = 10;

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

      const enrichedFixtures = await enrichFixturesWithHistory(fixtures);

      allFixtures.push(...enrichedFixtures);

      syncLog.push({
        competition: competition.name,
        leagueId: competition.id,
        season: data?.season || null,
        status: "OK",
        source: data?.source || "unknown",
        count: enrichedFixtures.length,
        rawResults: data?.rawResults ?? null,
        filteredResults: data?.filteredResults ?? null,
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

async function enrichFixturesWithHistory(fixtures) {
  const enriched = [];

  for (const fixture of fixtures) {
    const [homeHistory, awayHistory] = await Promise.all([
      fetchTeamHistory(fixture.homeId, fixture.season),
      fetchTeamHistory(fixture.awayId, fixture.season)
    ]);

    enriched.push({
      ...fixture,
      homeHistory,
      awayHistory
    });
  }

  return enriched;
}

async function fetchTeamHistory(teamId, season) {
  if (!teamId || !season) return [];

  try {
    const data = await fetchFromWorker("/rugby/team-games", {
      team: teamId,
      season,
      limit: HISTORY_LIMIT
    });

    return Array.isArray(data?.response) ? data.response : [];
  } catch (error) {
    console.warn("Rugby history error:", teamId, error);
    return [];
  }
}

function normalizeRugbyFixtures(items, competition, data) {
  return items.map(item => ({
    id: item.id,
    homeId: item.homeId || null,
    awayId: item.awayId || null,

    home: item.home,
    away: item.away,
    competition: item.competition || competition.name,
    date: item.date,
    status: item.status,

    leagueId: item.leagueId || competition.id,
    season: item.season || data?.season || null,

    source: "FrenchFlair",
    sport: "rugby",

    homeHistory: [],
    awayHistory: []
  }));
}
