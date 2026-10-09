import { getApiPauseUntil } from "./requestScheduler.js";
import { completeRefreshMeta } from "./refreshCompletion.js";
import { CONFIG } from "../config/config.js";
import { fetchFromWorker, getDateRange } from "./apiClient.js";
import { readHistoryCache, writeHistoryCache } from "./historyCache.js";
import { shouldSkipFixtureRefresh, fixtureRefreshPolicy } from "./fixtureRefreshPolicy.js";

const HISTORY_LIMIT = Number(CONFIG.nfl?.historyLimit || 30);
const HISTORY_CONCURRENCY = 2;

export async function fetchUpcomingNflFixtures({ onProgress, previousMatches = [], previousPayload = null, refreshMode = "startup" } = {}) {
  const previousById = new Map((Array.isArray(previousMatches) ? previousMatches : []).map(match => [String(match?.id), match]));
  const previousByIdentity = new Map((Array.isArray(previousMatches) ? previousMatches : []).map(match => [matchIdentity(match), match]).filter(([key]) => Boolean(key)));
  const range = getDateRange(CONFIG.analysisWindowDays);
  const leagueId = Number(CONFIG.nfl?.leagueId || 1);
  const freshness = fixtureRefreshPolicy({ previousPayload, refreshMode, range });
  if (shouldSkipFixtureRefresh({ previousPayload, refreshMode, range })) {
    const matches = Array.isArray(previousPayload?.matches) ? previousPayload.matches : previousMatches;
    const meta = { ...(previousPayload?.meta || {}), loading: false, phase: "fixture-cooldown", fixtureRefreshSkipped: true, fixtureRefreshReason: freshness.reason, fixtureRefreshPolicy: freshness };
    return { fixtures: matches, meta };
  }
  const diagnostics = createHistoryDiagnostics();
  const memo = new Map();

  try {
    const requestStartedAt = new Date().toISOString();
    const data = await fetchFromWorker("/nfl/games", { league: leagueId, from: range.from, to: range.to }, { forceFresh: refreshMode === "force" });
    const fixtures = normalizeNflGames(data?.response || []);
    const cacheHydrated = fixtures.map(fixture => hydrateFixtureFromPreviousOrCache(fixture, previousById, previousByIdentity));
    diagnostics.snapshotMatches = previousById.size; diagnostics.reusedMatches = cacheHydrated.filter(hasCompleteHistory).length; diagnostics.newMatches = cacheHydrated.filter(match => !findPreviousMatch(match, previousById, previousByIdentity)).length;
    const syncLog = [{ competition: "NFL", leagueId, status: cacheHydrated.length ? "LOADING_HISTORY" : "EMPTY", source: data?.source || "unknown", verifiedAt: data?.clientVerifiedAt || new Date().toISOString(), count: cacheHydrated.length, season: data?.season || null, message: cacheHydrated.length ? "Rencontres NFL chargées, historiques en cours." : "Aucune rencontre NFL dans la fenêtre d’analyse." }];
    diagnostics.fixtureRequest = { from: range.from, to: range.to, leagueId, status: "OK", returned: cacheHydrated.length, source: data?.source || "unknown", startedAt: requestStartedAt, completedAt: new Date().toISOString() };
    emitProgress(onProgress, cacheHydrated, range, syncLog, diagnostics, true, "fixtures", data?.season);

    const enriched = await mapWithConcurrency(cacheHydrated, HISTORY_CONCURRENCY, async fixture => {
      const homeHistory = fixture.homeHistory?.length ? fixture.homeHistory : await fetchTeamHistory(fixture.homeId, fixture.home, fixture.season, diagnostics, memo);
      const awayHistory = fixture.awayHistory?.length ? fixture.awayHistory : await fetchTeamHistory(fixture.awayId, fixture.away, fixture.season, diagnostics, memo);
      return { ...fixture, homeHistory, awayHistory };
    });
    syncLog[0].status = enriched.length ? "OK" : "EMPTY";
    syncLog[0].message = null;
    emitProgress(onProgress, enriched, range, syncLog, diagnostics, false, "complete", data?.season);
    return { fixtures: enriched, meta: completeRefreshMeta({ ...buildMeta(range, enriched, syncLog, diagnostics, false, "complete", data?.season), fixtureRefreshPolicy: freshness }) };
  } catch (error) {
    const rateLimited = Number(error?.status || 0) === 429 || error?.code === "API_SPORTS_RATE_LIMIT";
    const syncLog = [{ competition: "NFL", leagueId, status: rateLimited ? "RATE_LIMITED" : "ERROR", source: "api", count: 0, message: error?.message || String(error), code: error?.code || null, httpStatus: error?.status || null, detail: rateLimited ? "Différé — limite API-Sports. Utilisez Actualiser après la pause." : null }];
    diagnostics.fixtureRequest = { from: range.from, to: range.to, leagueId, status: rateLimited ? "RATE_LIMITED" : "ERROR", returned: 0, httpStatus: error?.status || null, code: error?.code || null, message: error?.message || String(error), completedAt: new Date().toISOString() };
    emitProgress(onProgress, [], range, syncLog, diagnostics, false, "error", null);
    throw error;
  }
}

function hydrateFixtureFromPreviousOrCache(fixture, previousById, previousByIdentity) {
  const previous = findPreviousMatch(fixture, previousById, previousByIdentity);
  const previousHome = Array.isArray(previous?.homeHistory) ? previous.homeHistory : [];
  const previousAway = Array.isArray(previous?.awayHistory) ? previous.awayHistory : [];
  return {
    ...fixture,
    homeHistory: previousHome.length ? previousHome : readCachedHistory(fixture.homeId),
    awayHistory: previousAway.length ? previousAway : readCachedHistory(fixture.awayId)
  };
}
function findPreviousMatch(fixture, previousById, previousByIdentity) {
  return previousById.get(String(fixture?.id)) || previousByIdentity.get(matchIdentity(fixture)) || null;
}
function matchIdentity(match) {
  if (!match) return "";
  const league = String(match.leagueId ?? "").trim();
  const home = String(match.homeId ?? match.home ?? "").trim().toLowerCase();
  const away = String(match.awayId ?? match.away ?? "").trim().toLowerCase();
  const dateRaw = match.date || match.matchDate || "";
  const parsed = Date.parse(dateRaw);
  const date = Number.isFinite(parsed) ? new Date(parsed).toISOString() : String(dateRaw).trim();
  if (!home || !away || !date) return "";
  return `${league}|${home}|${away}|${date}`;
}
function hasCompleteHistory(match) { return Array.isArray(match?.homeHistory) && match.homeHistory.length > 0 && Array.isArray(match?.awayHistory) && match.awayHistory.length > 0; }
function readCachedHistory(teamId) { return teamId ? readHistoryCache("nfl", `team:${teamId}:league:${CONFIG.nfl.leagueId}`) : []; }
async function fetchTeamHistory(teamId, teamName, season, diagnostics, memo) {
  if (!teamId) return [];
  const key = `team:${teamId}:league:${CONFIG.nfl.leagueId}`;
  const cached = readHistoryCache("nfl", key);
  if (cached.length) { diagnostics.cacheFallback += 1; diagnostics.gamesLoaded += cached.length; return cached; }
  if (memo.has(key)) return memo.get(key);
  if (diagnostics.stopped || getApiPauseUntil("/nfl") > Date.now()) {
    diagnostics.stopped = true; diagnostics.skipped += 1; return [];
  }
  const promise = (async () => {
    diagnostics.requested += 1;
    try {
      const data = await fetchFromWorker("/nfl/team-games", { team: teamId, league: CONFIG.nfl.leagueId, season, limit: HISTORY_LIMIT }, { attempts: 1, rateLimitRetries: 0 });
      const history = Array.isArray(data?.response) ? data.response : [];
      if (history.length) { diagnostics.apiSuccess += 1; diagnostics.gamesLoaded += history.length; writeHistoryCache("nfl", key, history); return history; }
      diagnostics.emptyResponses += 1;
    } catch (error) { diagnostics.errors += 1; if (error?.deferred || Number(error?.status) === 429) diagnostics.stopped = true; console.warn("NFL history error:", teamId, teamName, error); }
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
function createHistoryDiagnostics() { return { requested: 0, skipped: 0, stopped: false, apiSuccess: 0, cacheFallback: 0, emptyResponses: 0, errors: 0, gamesLoaded: 0, fixtureRequest: null }; }
function emitProgress(callback, fixtures, range, syncLog, diagnostics, loading, phase, season) { if (typeof callback === "function") callback({ fixtures: [...fixtures], meta: buildMeta(range, fixtures, syncLog, diagnostics, loading, phase, season) }); }
function buildMeta(range, fixtures, syncLog, diagnostics, loading, phase, season) { return { sport: "nfl", from: range.from, to: range.to, competitions: 1, total: fixtures.length, season: season || fixtures[0]?.season || null, syncedAt: new Date().toISOString(), fixturesVerifiedAt: oldestVerificationTime(syncLog), syncLog: syncLog.map(x => ({...x})), historyDiagnostics: {...diagnostics}, loading, phase }; }
async function mapWithConcurrency(items, limit, mapper) { const results = new Array(items.length); let next=0; const workers=Array.from({length:Math.min(limit,items.length)}, async()=>{ while(next<items.length){ const i=next++; results[i]=await mapper(items[i],i); }}); await Promise.all(workers); return results; }

function oldestVerificationTime(syncLog) {
  const times = syncLog.map(item => Date.parse(item.verifiedAt || "")).filter(Number.isFinite);
  return times.length ? new Date(Math.min(...times)).toISOString() : null;
}
