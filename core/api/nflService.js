import { CONFIG } from "../config/config.js";
import { fetchFromWorker, getDateRange } from "./apiClient.js";
import { readHistoryCache, writeHistoryCache } from "./historyCache.js";

const HISTORY_LIMIT = Number(CONFIG.nfl?.historyLimit || 30);
const HISTORY_CONCURRENCY = 2;

export async function fetchUpcomingNflFixtures({ onProgress } = {}) {
  const range = getDateRange(CONFIG.analysisWindowDays);
  const leagueId = Number(CONFIG.nfl?.leagueId || 1);
  const diagnostics = createHistoryDiagnostics();
  const memo = new Map();

  try {
    const data = await fetchFromWorker("/nfl/games", { league: leagueId, from: range.from, to: range.to });
    const fixtures = normalizeNflGames(data?.response || []);
    const cacheHydrated = fixtures.map(hydrateFixtureFromCache);
    const syncLog = [{ competition: "NFL", leagueId, status: cacheHydrated.length ? "LOADING_HISTORY" : "EMPTY", source: data?.source || "unknown", count: cacheHydrated.length, season: data?.season || null, message: cacheHydrated.length ? "Rencontres NFL chargées, historiques en cours." : "Aucune rencontre NFL dans la fenêtre d’analyse." }];
    emitProgress(onProgress, cacheHydrated, range, syncLog, diagnostics, true, "fixtures", data?.season);

    const enriched = await mapWithConcurrency(cacheHydrated, HISTORY_CONCURRENCY, async fixture => {
      const homeHistory = fixture.homeHistory?.length ? fixture.homeHistory : await fetchTeamHistory(fixture.homeId, fixture.home, fixture.season, diagnostics, memo);
      const awayHistory = fixture.awayHistory?.length ? fixture.awayHistory : await fetchTeamHistory(fixture.awayId, fixture.away, fixture.season, diagnostics, memo);
      return { ...fixture, homeHistory, awayHistory };
    });
    syncLog[0].status = enriched.length ? "OK" : "EMPTY";
    syncLog[0].message = null;
    emitProgress(onProgress, enriched, range, syncLog, diagnostics, false, "complete", data?.season);
    return { fixtures: enriched, meta: buildMeta(range, enriched, syncLog, diagnostics, false, "complete", data?.season) };
  } catch (error) {
    const syncLog = [{ competition: "NFL", leagueId, status: "ERROR", source: "api", count: 0, message: error?.message || String(error), code: error?.code || null, httpStatus: error?.status || null }];
    emitProgress(onProgress, [], range, syncLog, diagnostics, false, "error", null);
    throw error;
  }
}

function hydrateFixtureFromCache(fixture) {
  return { ...fixture, homeHistory: readCachedHistory(fixture.homeId), awayHistory: readCachedHistory(fixture.awayId) };
}
function readCachedHistory(teamId) { return teamId ? readHistoryCache("nfl", `team:${teamId}:league:${CONFIG.nfl.leagueId}`) : []; }
async function fetchTeamHistory(teamId, teamName, season, diagnostics, memo) {
  if (!teamId) return [];
  const key = `team:${teamId}:league:${CONFIG.nfl.leagueId}`;
  const cached = readHistoryCache("nfl", key);
  if (cached.length) { diagnostics.cacheFallback += 1; diagnostics.gamesLoaded += cached.length; return cached; }
  if (memo.has(key)) return memo.get(key);
  const promise = (async () => {
    diagnostics.requested += 1;
    try {
      const data = await fetchFromWorker("/nfl/team-games", { team: teamId, league: CONFIG.nfl.leagueId, season, limit: HISTORY_LIMIT });
      const history = Array.isArray(data?.response) ? data.response : [];
      if (history.length) { diagnostics.apiSuccess += 1; diagnostics.gamesLoaded += history.length; writeHistoryCache("nfl", key, history); return history; }
      diagnostics.emptyResponses += 1;
    } catch (error) { diagnostics.errors += 1; console.warn("NFL history error:", teamId, teamName, error); }
    return [];
  })();
  memo.set(key, promise); return promise;
}
function normalizeNflGames(items) {
  return items.map(item => ({
    id: item.id, homeId: item.homeId || null, awayId: item.awayId || null,
    homeLogo: item.homeLogo || "", awayLogo: item.awayLogo || "", home: item.home || "", away: item.away || "",
    competition: "NFL", leagueId: Number(item.leagueId || CONFIG.nfl.leagueId), season: item.season || null,
    date: item.date, status: item.status || null, stage: item.stage || null, week: item.week || null,
    source: "NFL Totals", sport: "nfl", homeHistory: [], awayHistory: []
  }));
}
function createHistoryDiagnostics() { return { requested: 0, apiSuccess: 0, cacheFallback: 0, emptyResponses: 0, errors: 0, gamesLoaded: 0 }; }
function emitProgress(callback, fixtures, range, syncLog, diagnostics, loading, phase, season) { if (typeof callback === "function") callback({ fixtures: [...fixtures], meta: buildMeta(range, fixtures, syncLog, diagnostics, loading, phase, season) }); }
function buildMeta(range, fixtures, syncLog, diagnostics, loading, phase, season) { return { sport: "nfl", from: range.from, to: range.to, competitions: 1, total: fixtures.length, season: season || fixtures[0]?.season || null, syncedAt: new Date().toISOString(), syncLog: syncLog.map(x => ({...x})), historyDiagnostics: {...diagnostics}, loading, phase }; }
async function mapWithConcurrency(items, limit, mapper) { const results = new Array(items.length); let next=0; const workers=Array.from({length:Math.min(limit,items.length)}, async()=>{ while(next<items.length){ const i=next++; results[i]=await mapper(items[i],i); }}); await Promise.all(workers); return results; }
