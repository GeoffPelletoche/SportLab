import { CONFIG } from "../config/config.js";
import { fetchFromWorker, getDateRange } from "./apiClient.js";
import { readHistoryCache, writeHistoryCache } from "./historyCache.js";

const HISTORY_LIMIT = 30;

export async function fetchUpcomingFootballFixtures() {
  const range = getDateRange(CONFIG.analysisWindowDays);
  const activeCompetitions = CONFIG.drawhunter.competitions.filter(c => c.active);
  const allFixtures = [];
  const syncLog = [];
  const historyStats = createHistoryStats();
  const requestMemo = new Map();

  for (const competition of activeCompetitions) {
    try {
      const data = await fetchFromWorker("/football/fixtures", {
        league: competition.id,
        from: range.from,
        to: range.to
      });
      const fixtures = normalizeFootballFixtures(data?.response || [], competition);
      const enrichedFixtures = await enrichFixturesWithHistory(fixtures, historyStats, requestMemo);
      allFixtures.push(...enrichedFixtures);
      syncLog.push({
        competition: competition.name,
        leagueId: competition.id,
        status: "OK",
        source: data?.source || "unknown",
        count: enrichedFixtures.length
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
      sport: "football",
      from: range.from,
      to: range.to,
      competitions: activeCompetitions.length,
      total: allFixtures.length,
      syncedAt: new Date().toISOString(),
      syncLog,
      history: finalizeHistoryStats(historyStats)
    }
  };
}

async function enrichFixturesWithHistory(fixtures, stats, memo) {
  const enriched = [];
  for (const fixture of fixtures) {
    const [homeHistory, awayHistory] = await Promise.all([
      fetchTeamHistory(fixture.homeId, fixture.leagueId, stats, memo),
      fetchTeamHistory(fixture.awayId, fixture.leagueId, stats, memo)
    ]);
    enriched.push({ ...fixture, homeHistory, awayHistory });
  }
  return enriched;
}

async function fetchTeamHistory(teamId, leagueId, stats, memo) {
  if (!teamId) {
    stats.missingIdentity += 1;
    return [];
  }

  const memoKey = `${leagueId || "all"}:${teamId}`;
  if (memo.has(memoKey)) return memo.get(memoKey);

  const promise = fetchTeamHistoryUncached(teamId, leagueId, stats);
  memo.set(memoKey, promise);
  return promise;
}

async function fetchTeamHistoryUncached(teamId, leagueId, stats) {
  stats.requested += 1;
  const cached = readHistoryCache("football", teamId, leagueId);

  try {
    const data = await fetchFromWorker("/football/team-fixtures", {
      team: teamId,
      league: leagueId,
      limit: HISTORY_LIMIT
    });
    const history = Array.isArray(data?.response) ? data.response : [];

    if (history.length > 0) {
      writeHistoryCache("football", teamId, leagueId, history);
      stats.apiSuccess += 1;
      stats.matchesLoaded += history.length;
      return history;
    }

    if (cached.length > 0) {
      stats.cacheFallback += 1;
      stats.matchesLoaded += cached.length;
      return cached;
    }

    stats.empty += 1;
    return [];
  } catch (error) {
    stats.errors += 1;
    stats.lastErrors.push({ teamId, leagueId, message: error.message });

    if (cached.length > 0) {
      stats.cacheFallback += 1;
      stats.matchesLoaded += cached.length;
      return cached;
    }

    console.warn("Football history error:", teamId, error);
    return [];
  }
}

function createHistoryStats() {
  return {
    requested: 0,
    apiSuccess: 0,
    cacheFallback: 0,
    empty: 0,
    errors: 0,
    missingIdentity: 0,
    matchesLoaded: 0,
    lastErrors: []
  };
}

function finalizeHistoryStats(stats) {
  return {
    ...stats,
    lastErrors: stats.lastErrors.slice(-10),
    reliable: stats.requested > 0 && stats.empty === 0 && stats.errors === 0
  };
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
