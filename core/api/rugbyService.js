import { CONFIG } from "../config/config.js";
import { fetchFromWorker, getDateRange } from "./apiClient.js";
import { readHistoryCache, writeHistoryCache } from "./historyCache.js";

const HISTORY_LIMIT = 30;
const HISTORY_CONCURRENCY = 3;

export async function fetchUpcomingRugbyFixtures({ onProgress } = {}) {
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
      const cacheHydrated = fixtures.map(fixture => hydrateFixtureFromCache(fixture));
      allFixtures.push(...cacheHydrated);
      const logEntry = {
        competition: competition.name, leagueId: competition.id, season: data?.season || null,
        status: cacheHydrated.length ? "LOADING_HISTORY" : "EMPTY", source: data?.source || "unknown", count: cacheHydrated.length,
        rawResults: data?.rawResults ?? null, filteredResults: data?.filteredResults ?? null,
        message: cacheHydrated.length ? "Rencontres chargées, historiques en cours." : (data?.warning || null)
      };
      syncLog.push(logEntry);
      emitProgress(onProgress, allFixtures, range, activeCompetitions, syncLog, historyDiagnostics, true, "fixtures");

      const enrichedFixtures = await mapWithConcurrency(cacheHydrated, HISTORY_CONCURRENCY, async fixture => {
        const homeHistory = fixture.homeHistory?.length ? fixture.homeHistory : await fetchTeamHistory(fixture.homeId, fixture.home, fixture.leagueId, fixture.season, historyDiagnostics, requestMemo);
        const awayHistory = fixture.awayHistory?.length ? fixture.awayHistory : await fetchTeamHistory(fixture.awayId, fixture.away, fixture.leagueId, fixture.season, historyDiagnostics, requestMemo);
        return { ...fixture, homeHistory, awayHistory };
      });
      const byId = new Map(enrichedFixtures.map(item => [String(item.id), item]));
      for (let i = 0; i < allFixtures.length; i += 1) { const replacement = byId.get(String(allFixtures[i].id)); if (replacement) allFixtures[i] = replacement; }
      logEntry.status = enrichedFixtures.length ? "OK" : "EMPTY";
      logEntry.message = data?.warning || null;
      emitProgress(onProgress, allFixtures, range, activeCompetitions, syncLog, historyDiagnostics, true, "history");
    } catch (error) {
      syncLog.push({ competition: competition.name, leagueId: competition.id, status: "ERROR", source: "api", count: 0, message: error.message });
      emitProgress(onProgress, allFixtures, range, activeCompetitions, syncLog, historyDiagnostics, true, "error");
    }
  }
  const meta = buildMeta(range, activeCompetitions, allFixtures, syncLog, historyDiagnostics, false, "complete");
  emitProgress(onProgress, allFixtures, range, activeCompetitions, syncLog, historyDiagnostics, false, "complete");
  return { fixtures: allFixtures, meta };
}

function hydrateFixtureFromCache(fixture) { return { ...fixture, homeHistory: readCachedTeamHistory(fixture.homeId, fixture.home, fixture.leagueId), awayHistory: readCachedTeamHistory(fixture.awayId, fixture.away, fixture.leagueId) }; }
function readCachedTeamHistory(teamId, teamName, leagueId) {
  const cleanName = decodeHtmlEntities(teamName).trim(); if (!teamId && !cleanName) return [];
  const identity = teamId || `name:${normalizeTeamName(cleanName)}`;
  const cacheKey = `${identity}:${normalizeTeamName(cleanName) || "unknown"}:${leagueId || "all"}`;
  return readHistoryCache("rugby", cacheKey);
}
function emitProgress(callback, fixtures, range, competitions, syncLog, historyDiagnostics, loading, phase) {
  if (typeof callback !== "function") return;
  callback({ fixtures: [...fixtures], meta: buildMeta(range, competitions, fixtures, syncLog, historyDiagnostics, loading, phase) });
}
function buildMeta(range, competitions, fixtures, syncLog, historyDiagnostics, loading, phase) {
  return { sport: "rugby", from: range.from, to: range.to, competitions: competitions.length, total: fixtures.length, syncedAt: new Date().toISOString(), syncLog: syncLog.map(item => ({ ...item })), historyDiagnostics: { ...historyDiagnostics }, loading, phase };
}
async function fetchTeamHistory(teamId, teamName, leagueId, season, diagnostics, memo) {
  const cleanName = decodeHtmlEntities(teamName).trim(); if ((!teamId && !cleanName) || !season) return [];
  const identity = teamId || `name:${normalizeTeamName(cleanName)}`; const memoKey = `${identity}:${leagueId || "all"}:${season}`; if (memo.has(memoKey)) return memo.get(memoKey);
  const cacheKey = `${identity}:${normalizeTeamName(cleanName) || "unknown"}:${leagueId || "all"}`;
  const cached = readHistoryCache("rugby", cacheKey);
  if (cached.length) { diagnostics.cacheFallback += 1; diagnostics.gamesLoaded += cached.length; return cached; }
  const promise = (async () => {
    diagnostics.requested += 1;
    try {
      const data = await fetchFromWorker("/rugby/team-games", { team: teamId || undefined, teamName: cleanName || undefined, league: leagueId, season, limit: HISTORY_LIMIT });
      const history = Array.isArray(data?.response) ? data.response : [];
      if (history.length) { diagnostics.apiSuccess += 1; diagnostics.gamesLoaded += history.length; writeHistoryCache("rugby", cacheKey, history); return history; }
      diagnostics.emptyResponses += 1;
    } catch (error) { diagnostics.errors += 1; console.warn("Rugby history error:", identity, cleanName, error); }
    return [];
  })();
  memo.set(memoKey, promise); return promise;
}
async function mapWithConcurrency(items, limit, mapper) { const results = new Array(items.length); let nextIndex = 0; const workers = Array.from({ length: Math.min(limit, items.length) }, async () => { while (nextIndex < items.length) { const index = nextIndex++; results[index] = await mapper(items[index], index); } }); await Promise.all(workers); return results; }
function createHistoryDiagnostics() { return { requested: 0, apiSuccess: 0, cacheFallback: 0, emptyResponses: 0, errors: 0, gamesLoaded: 0 }; }
function normalizeRugbyFixtures(items, competition, data) { return items.map(item => ({ id: item.id, homeId: item.homeId || null, awayId: item.awayId || null, homeLogo: item.homeLogo || (item.homeId ? `https://media.api-sports.io/rugby/teams/${item.homeId}.png` : ""), awayLogo: item.awayLogo || (item.awayId ? `https://media.api-sports.io/rugby/teams/${item.awayId}.png` : ""), home: decodeHtmlEntities(item.home), away: decodeHtmlEntities(item.away), competition: decodeHtmlEntities(item.competition || competition.name), date: item.date, status: item.status, leagueId: item.leagueId || competition.id, season: item.season || data?.season || null, source: "FrenchFlair", sport: "rugby", homeHistory: [], awayHistory: [] })); }
function decodeHtmlEntities(value) { return String(value || "").replace(/&apos;|&#39;|&#039;/gi, "'").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&nbsp;/gi, " "); }
function normalizeTeamName(value) { return decodeHtmlEntities(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/&/g, " and ").replace(/\b(rugby|football|club|union|team)\b/g, " ").replace(/[^a-z0-9]+/g, " ").trim(); }
