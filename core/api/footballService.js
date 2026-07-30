import { CONFIG } from "../config/config.js";
import { fetchFromWorker, getDateRange } from "./apiClient.js";

const HISTORY_LIMIT = 30;

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
      const enrichedFixtures = await enrichFixturesWithHistory(fixtures);
      allFixtures.push(...enrichedFixtures);
      syncLog.push({ competition: competition.name, leagueId: competition.id, status: "OK", source: data?.source || "unknown", count: enrichedFixtures.length });
    } catch (error) {
      syncLog.push({ competition: competition.name, leagueId: competition.id, status: "ERROR", source: "api", count: 0, message: error.message });
    }
  }

  return { fixtures: allFixtures, meta: { sport: "football", from: range.from, to: range.to, competitions: activeCompetitions.length, total: allFixtures.length, syncedAt: new Date().toISOString(), syncLog } };
}

async function enrichFixturesWithHistory(fixtures) {
  const enriched = [];
  for (const fixture of fixtures) {
    const [homeHistory, awayHistory] = await Promise.all([
      fetchTeamHistory(fixture.homeId),
      fetchTeamHistory(fixture.awayId)
    ]);
    enriched.push({ ...fixture, homeHistory, awayHistory });
  }
  return enriched;
}

async function fetchTeamHistory(teamId) {
  if (!teamId) return [];
  try {
    const data = await fetchFromWorker("/football/team-fixtures", { team: teamId, limit: HISTORY_LIMIT });
    return Array.isArray(data?.response) ? data.response : [];
  } catch (error) {
    console.warn("Football history error:", teamId, error);
    return [];
  }
}

function normalizeFootballFixtures(items, competition) {
  return items.map(item => ({
    id: item.id,
    homeId: item.homeId || null,
    awayId: item.awayId || null,
    home: item.home,
    away: item.away,
    competition: item.competition || competition.name,
    leagueId: item.leagueId || competition.id,
    season: item.season || null,
    date: item.date,
    status: item.status || null,
    source: "DrawHunter",
    sport: "football",
    homeHistory: [],
    awayHistory: []
  }));
}
