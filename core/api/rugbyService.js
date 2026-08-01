import { CONFIG } from "../config/config.js";
import { fetchFromWorker, getDateRange } from "./apiClient.js";
import { readHistoryCache, writeHistoryCache } from "./historyCache.js";

const HISTORY_LIMIT = 30;

export async function fetchUpcomingRugbyFixtures() {
  const range = getDateRange(CONFIG.analysisWindowDays);
  const activeCompetitions = CONFIG.frenchflair.competitions.filter(c => c.active);
  const allFixtures = [];
  const syncLog = [];
  const historyDiagnostics = createHistoryDiagnostics();
  const requestMemo = new Map();

  for (const competition of activeCompetitions) {
    try {
      const data = await fetchFromWorker("/rugby/fixtures", { league: competition.id, from: range.from, to: range.to });
      const raw = Array.isArray(data?.response) ? data.response : [];
      const fixtures = normalizeRugbyFixtures(raw, competition, data);
      const enrichedFixtures = await enrichFixturesWithHistory(fixtures, historyDiagnostics, requestMemo);
      allFixtures.push(...enrichedFixtures);
      syncLog.push({ competition: competition.name, leagueId: competition.id, season: data?.season || null, status: "OK", source: data?.source || "unknown", count: enrichedFixtures.length, rawResults: data?.rawResults ?? null, filteredResults: data?.filteredResults ?? null, message: data?.warning || null });
    } catch (error) {
      syncLog.push({ competition: competition.name, leagueId: competition.id, status: "ERROR", source: "api", count: 0, message: error.message });
    }
  }

  return { fixtures: allFixtures, meta: { sport: "rugby", from: range.from, to: range.to, competitions: activeCompetitions.length, total: allFixtures.length, syncedAt: new Date().toISOString(), syncLog, historyDiagnostics } };
}

async function enrichFixturesWithHistory(fixtures, diagnostics, memo) {
  return Promise.all(fixtures.map(async fixture => {
    const [homeHistory, awayHistory] = await Promise.all([
      fetchTeamHistory(fixture.homeId, fixture.home, fixture.leagueId, fixture.season, diagnostics, memo),
      fetchTeamHistory(fixture.awayId, fixture.away, fixture.leagueId, fixture.season, diagnostics, memo)
    ]);
    return { ...fixture, homeHistory, awayHistory };
  }));
}

async function fetchTeamHistory(teamId, teamName, leagueId, season, diagnostics, memo) {
  if (!teamId || !season) return [];
  const memoKey = `${teamId}:${teamName || "unknown"}:${leagueId}:${season}`;
  if (memo.has(memoKey)) return memo.get(memoKey);
  const promise = (async () => {
    diagnostics.requested += 1;
    try {
      const data = await fetchFromWorker("/rugby/team-games", {
        team: teamId,
        teamName,
        league: leagueId,
        season,
        limit: HISTORY_LIMIT
      });
      const history = Array.isArray(data?.response) ? data.response : [];
      if (history.length) {
        diagnostics.apiSuccess += 1;
        diagnostics.gamesLoaded += history.length;
        writeHistoryCache("rugby", `${teamId}:${teamName || "unknown"}:${leagueId || "all"}`, history);
        return history;
      }
      diagnostics.emptyResponses += 1;
    } catch (error) {
      diagnostics.errors += 1;
      console.warn("Rugby history error:", teamId, error);
    }
    const cached = readHistoryCache("rugby", `${teamId}:${teamName || "unknown"}:${leagueId || "all"}`);
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

function createHistoryDiagnostics(){ return { requested:0, apiSuccess:0, cacheFallback:0, emptyResponses:0, errors:0, gamesLoaded:0 }; }
function normalizeRugbyFixtures(items, competition, data) { return items.map(item => ({ id:item.id, homeId:item.homeId||null, awayId:item.awayId||null, home:item.home, away:item.away, competition:item.competition||competition.name, date:item.date, status:item.status, leagueId:item.leagueId||competition.id, season:item.season||data?.season||null, source:"FrenchFlair", sport:"rugby", homeHistory:[], awayHistory:[] })); }
