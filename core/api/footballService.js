import { CONFIG } from "../config/config.js";
import { fetchFromWorker, getDateRange } from "./apiClient.js";
import { readHistoryCache, writeHistoryCache } from "./historyCache.js";

const HISTORY_LIMIT = 30;
export async function fetchUpcomingFootballFixtures() {
  const range = getDateRange(CONFIG.analysisWindowDays);
  const activeCompetitions = CONFIG.drawhunter.competitions.filter(c => c.active);
  const allFixtures = [], syncLog = [], historyDiagnostics = createHistoryDiagnostics();
  const requestMemo = new Map();
  for (const competition of activeCompetitions) {
    try {
      const data = await fetchFromWorker("/football/fixtures", { league: competition.id, from: range.from, to: range.to });
      const fixtures = normalizeFootballFixtures(data?.response || [], competition);
      const enrichedFixtures = await Promise.all(fixtures.map(async fixture => {
        const [homeHistory, awayHistory] = await Promise.all([
          fetchTeamHistory(fixture.homeId, fixture.leagueId, fixture.season, historyDiagnostics, requestMemo),
          fetchTeamHistory(fixture.awayId, fixture.leagueId, fixture.season, historyDiagnostics, requestMemo)
        ]);
        return { ...fixture, homeHistory, awayHistory };
      }));
      allFixtures.push(...enrichedFixtures);
      syncLog.push({ competition: competition.name, leagueId: competition.id, status: "OK", source: data?.source || "unknown", count: enrichedFixtures.length });
    } catch (error) { syncLog.push({ competition: competition.name, leagueId: competition.id, status: "ERROR", source: "api", count:0, message:error.message }); }
  }
  return { fixtures:allFixtures, meta:{ sport:"football", from:range.from, to:range.to, competitions:activeCompetitions.length, total:allFixtures.length, syncedAt:new Date().toISOString(), syncLog, historyDiagnostics } };
}
async function fetchTeamHistory(teamId, leagueId, season, diagnostics, memo) {
  if (!teamId) return [];
  const key = `${teamId}:${leagueId || "all"}:${season || "auto"}`;
  if (memo.has(key)) return memo.get(key);
  const promise = (async () => {
    diagnostics.requested += 1;
    try {
      const data = await fetchFromWorker("/football/team-fixtures", { team:teamId, league:leagueId, season, limit:HISTORY_LIMIT });
      const history = Array.isArray(data?.response) ? data.response : [];
      if (history.length) { diagnostics.apiSuccess += 1; diagnostics.gamesLoaded += history.length; writeHistoryCache("football", `${teamId}:${leagueId || "all"}`, history); return history; }
      diagnostics.emptyResponses += 1;
    } catch(error) { diagnostics.errors += 1; console.warn("Football history error:", teamId, error); }
    const cached = readHistoryCache("football", `${teamId}:${leagueId || "all"}`);
    if (cached.length) { diagnostics.cacheFallback += 1; diagnostics.gamesLoaded += cached.length; return cached; }
    return [];
  })();
  memo.set(key, promise); return promise;
}
function createHistoryDiagnostics(){ return { requested:0, apiSuccess:0, cacheFallback:0, emptyResponses:0, errors:0, gamesLoaded:0 }; }
function normalizeFootballFixtures(items, competition) { return items.map(item => ({ id:item.id, homeId:item.homeId||null, awayId:item.awayId||null, home:item.home, away:item.away, competition:item.competition||competition.name, leagueId:item.leagueId||competition.id, season:item.season||null, date:item.date, status:item.status||null, source:"DrawHunter", sport:"football", homeHistory:[], awayHistory:[] })); }
