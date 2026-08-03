import { CONFIG } from "../config/config.js";
import { fetchFromWorker, getDateRange } from "./apiClient.js";
import { readHistoryCache, writeHistoryCache } from "./historyCache.js";

const HISTORY_LIMIT = 30;
const HISTORY_CONCURRENCY = 3;

export async function fetchUpcomingRugbyFixtures() {
  const range = getDateRange(CONFIG.analysisWindowDays);
  const activeCompetitions = CONFIG.frenchflair.competitions.filter(c => c.active);
  const allFixtures = [];
  const syncLog = [];
  const historyDiagnostics = createHistoryDiagnostics();
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
      const enrichedFixtures = await mapWithConcurrency(
        fixtures,
        HISTORY_CONCURRENCY,
        async fixture => {
          const homeHistory = await fetchTeamHistory(
            fixture.homeId,
            fixture.home,
            fixture.leagueId,
            fixture.season,
            historyDiagnostics,
            requestMemo
          );
          const awayHistory = await fetchTeamHistory(
            fixture.awayId,
            fixture.away,
            fixture.leagueId,
            fixture.season,
            historyDiagnostics,
            requestMemo
          );
          return { ...fixture, homeHistory, awayHistory };
        }
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
      historyDiagnostics
    }
  };
}

async function fetchTeamHistory(teamId, teamName, leagueId, season, diagnostics, memo) {
  const cleanName = decodeHtmlEntities(teamName).trim();
  if ((!teamId && !cleanName) || !season) return [];

  const identity = teamId || `name:${normalizeTeamName(cleanName)}`;
  const memoKey = `${identity}:${leagueId || "all"}:${season}`;
  if (memo.has(memoKey)) return memo.get(memoKey);

  const cacheKey = `${identity}:${normalizeTeamName(cleanName) || "unknown"}:${leagueId || "all"}`;
  const promise = (async () => {
    diagnostics.requested += 1;
    try {
      const data = await fetchFromWorker("/rugby/team-games", {
        team: teamId || undefined,
        teamName: cleanName || undefined,
        league: leagueId,
        season,
        limit: HISTORY_LIMIT
      });
      const history = Array.isArray(data?.response) ? data.response : [];
      if (history.length) {
        diagnostics.apiSuccess += 1;
        diagnostics.gamesLoaded += history.length;
        writeHistoryCache("rugby", cacheKey, history);
        return history;
      }
      diagnostics.emptyResponses += 1;
    } catch (error) {
      diagnostics.errors += 1;
      console.warn("Rugby history error:", identity, cleanName, error);
    }

    const cached = readHistoryCache("rugby", cacheKey);
    if (cached.length) {
      diagnostics.cacheFallback += 1;
      diagnostics.gamesLoaded += cached.length;
      return cached;
    }
    return [];
  })();

  memo.set(memoKey, promise);
  return promise;
}

async function mapWithConcurrency(items, limit, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await mapper(items[index], index);
    }
  });
  await Promise.all(workers);
  return results;
}

function createHistoryDiagnostics() {
  return { requested: 0, apiSuccess: 0, cacheFallback: 0, emptyResponses: 0, errors: 0, gamesLoaded: 0 };
}

function normalizeRugbyFixtures(items, competition, data) {
  return items.map(item => ({
    id: item.id,
    homeId: item.homeId || null,
    awayId: item.awayId || null,
    homeLogo: item.homeLogo || (item.homeId ? `https://media.api-sports.io/rugby/teams/${item.homeId}.png` : ""),
    awayLogo: item.awayLogo || (item.awayId ? `https://media.api-sports.io/rugby/teams/${item.awayId}.png` : ""),
    home: decodeHtmlEntities(item.home),
    away: decodeHtmlEntities(item.away),
    competition: decodeHtmlEntities(item.competition || competition.name),
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

function decodeHtmlEntities(value) {
  return String(value || "")
    .replace(/&apos;|&#39;|&#039;/gi, "'")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&nbsp;/gi, " ");
}

function normalizeTeamName(value) {
  return decodeHtmlEntities(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\b(rugby|football|club|union|team)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
