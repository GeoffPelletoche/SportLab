import { CONFIG } from "../config/config.js";
import { fetchFromWorker, getDateRange } from "./apiClient.js";
import { readHistoryCache, writeHistoryCache } from "./historyCache.js";

const HISTORY_LIMIT = 30;

export async function fetchUpcomingRugbyFixtures() {
  const range = getDateRange(CONFIG.analysisWindowDays);
  const activeCompetitions = CONFIG.frenchflair.competitions.filter(c => c.active);
  const allFixtures = [];
  const syncLog = [];
  const historyStats = createHistoryStats();
  const requestMemo = new Map();

  for (const competition of activeCompetitions) {
    try {
      const data = await fetchFromWorker("/rugby/fixtures", {
        league: competition.id,
        from: range.from,
        to: range.to
      });

      const raw = Array.isArray(data?.response) ? data.response : [];
      const fixtures = normalizeRugbyFixtures(raw, competition, data);
      const enrichedFixtures = await enrichFixturesWithHistory(
        fixtures,
        historyStats,
        requestMemo
      );

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
      syncLog,
      history: finalizeHistoryStats(historyStats)
    }
  };
}

async function enrichFixturesWithHistory(fixtures, stats, memo) {
  const enriched = [];

  for (const fixture of fixtures) {
    const [homeHistory, awayHistory] = await Promise.all([
      fetchTeamHistory(fixture.homeId, fixture.leagueId, fixture.season, stats, memo),
      fetchTeamHistory(fixture.awayId, fixture.leagueId, fixture.season, stats, memo)
    ]);

    enriched.push({
      ...fixture,
      homeHistory,
      awayHistory
    });
  }

  return enriched;
}

async function fetchTeamHistory(teamId, leagueId, season, stats, memo) {
  if (!teamId || !season) {
    stats.missingIdentity += 1;
    return [];
  }

  const memoKey = `${leagueId || "all"}:${teamId}:${season}`;
  if (memo.has(memoKey)) return memo.get(memoKey);

  const promise = fetchTeamHistoryUncached(teamId, leagueId, season, stats);
  memo.set(memoKey, promise);
  return promise;
}

async function fetchTeamHistoryUncached(teamId, leagueId, season, stats) {
  stats.requested += 1;
  const cached = readHistoryCache("rugby", teamId, leagueId);

  try {
    const data = await fetchFromWorker("/rugby/team-games", {
      team: teamId,
      league: leagueId,
      season,
      limit: HISTORY_LIMIT
    });

    const history = Array.isArray(data?.response) ? data.response : [];

    if (history.length > 0) {
      writeHistoryCache("rugby", teamId, leagueId, history);
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

    console.warn("Rugby history error:", teamId, error);
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
