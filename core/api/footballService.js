import { CONFIG } from "../config/config.js";
import { fetchFromWorker, getDateRange } from "./apiClient.js";
import { readHistoryCache, writeHistoryCache } from "./historyCache.js";
import { shouldSkipFixtureRefresh, fixtureRefreshPolicy } from "./fixtureRefreshPolicy.js";

const HISTORY_LIMIT = 30;
const HISTORY_CONCURRENCY = 2;

export async function fetchUpcomingFootballFixtures({ onProgress, previousMatches = [], previousPayload = null, refreshMode = "startup" } = {}) {
  const previousById = new Map((Array.isArray(previousMatches) ? previousMatches : []).map(match => [String(match?.id), match]));
  const previousByIdentity = new Map((Array.isArray(previousMatches) ? previousMatches : []).map(match => [matchIdentity(match), match]).filter(([key]) => Boolean(key)));
  const range = getDateRange(CONFIG.analysisWindowDays);
  const activeCompetitions = CONFIG.drawhunter.competitions.filter(c => c.active);
  const freshness = fixtureRefreshPolicy({ previousPayload, refreshMode, range });
  if (shouldSkipFixtureRefresh({ previousPayload, refreshMode, range })) {
    const matches = Array.isArray(previousPayload?.matches) ? previousPayload.matches : previousMatches;
    const meta = { ...(previousPayload?.meta || {}), loading: false, phase: "fixture-cooldown", fixtureRefreshSkipped: true, fixtureRefreshReason: freshness.reason, fixtureRefreshPolicy: freshness };
    return { fixtures: matches, meta };
  }
  const allFixtures = [];
  const syncLog = [];
  const historyDiagnostics = createHistoryDiagnostics();
  const requestMemo = new Map();

  // V11.7.8 — Fixtures First: les six championnats sont mis en file prioritaire
  // immédiatement; aucun historique d'équipe ne bloque le championnat suivant.
  const fixtureResults = await Promise.all(activeCompetitions.map(async competition => {
    try {
      const data = await fetchFromWorker("/football/fixtures", { league: competition.id, from: range.from, to: range.to }, { forceFresh: refreshMode === "force" });
      const fixtures = normalizeFootballFixtures(data?.response || [], competition).map(fixture => hydrateFixtureFromPreviousOrCache(fixture, previousById, previousByIdentity));
      const logEntry = {
        competition: competition.name, leagueId: competition.id,
        status: fixtures.length ? "LOADING_HISTORY" : "EMPTY", source: data?.source || "unknown", verifiedAt: data?.clientVerifiedAt || new Date().toISOString(), count: fixtures.length,
        season: data?.season ?? null,
        message: fixtures.length ? "Rencontres chargées, historiques en arrière-plan." : "Aucune rencontre dans la fenêtre d’analyse."
      };
      syncLog.push(logEntry); allFixtures.push(...fixtures);
      emitProgress(onProgress, allFixtures, range, activeCompetitions, syncLog, historyDiagnostics, true, "fixtures");
      return { competition, data, fixtures, logEntry };
    } catch (error) {
      const rateLimited = Number(error?.status || 0) === 429 || error?.code === "API_SPORTS_RATE_LIMIT";
      const logEntry = { competition: competition.name, leagueId: competition.id, status: rateLimited ? "RATE_LIMITED" : "ERROR", source: "api", count: 0, message: error.message, code: error?.code || null, httpStatus: error?.status || null, detail: rateLimited ? "Différé — limite API-Sports. SportLab reprendra automatiquement après temporisation." : classifyFootballError(error) };
      syncLog.push(logEntry);
      emitProgress(onProgress, allFixtures, range, activeCompetitions, syncLog, historyDiagnostics, true, "error");
      return { competition, data: null, fixtures: [], logEntry, error };
    }
  }));

  historyDiagnostics.snapshotMatches = previousById.size;
  historyDiagnostics.reusedMatches = allFixtures.filter(hasCompleteHistory).length;
  historyDiagnostics.newMatches = allFixtures.filter(match => !findPreviousMatch(match, previousById, previousByIdentity)).length;

  await Promise.all(fixtureResults.map(async ({ fixtures, logEntry }) => {
    if (!fixtures.length) return;
    const enrichedFixtures = await mapWithConcurrency(fixtures, HISTORY_CONCURRENCY, async fixture => {
      const homeHistory = fixture.homeHistory?.length ? fixture.homeHistory : await fetchTeamHistory(fixture.homeId, fixture.home, fixture.leagueId, fixture.season, historyDiagnostics, requestMemo);
      const awayHistory = fixture.awayHistory?.length ? fixture.awayHistory : await fetchTeamHistory(fixture.awayId, fixture.away, fixture.leagueId, fixture.season, historyDiagnostics, requestMemo);
      return { ...fixture, homeHistory, awayHistory };
    });
    const byId = new Map(enrichedFixtures.map(item => [String(item.id), item]));
    for (let i = 0; i < allFixtures.length; i += 1) { const replacement = byId.get(String(allFixtures[i].id)); if (replacement) allFixtures[i] = replacement; }
    logEntry.status = enrichedFixtures.length > 0 ? "OK" : "EMPTY"; logEntry.message = null;
    emitProgress(onProgress, allFixtures, range, activeCompetitions, syncLog, historyDiagnostics, true, "history");
  }));

  const meta = { ...buildMeta(range, activeCompetitions, allFixtures, syncLog, historyDiagnostics, false, "complete"), fixtureRefreshPolicy: freshness };
  emitProgress(onProgress, allFixtures, range, activeCompetitions, syncLog, historyDiagnostics, false, "complete");
  return { fixtures: allFixtures, meta };
}

function hydrateFixtureFromPreviousOrCache(fixture, previousById, previousByIdentity) {
  const previous = findPreviousMatch(fixture, previousById, previousByIdentity);
  const previousHome = Array.isArray(previous?.homeHistory) ? previous.homeHistory : [];
  const previousAway = Array.isArray(previous?.awayHistory) ? previous.awayHistory : [];
  return {
    ...fixture,
    homeHistory: previousHome.length ? previousHome : readCachedTeamHistory(fixture.homeId, fixture.home, fixture.leagueId),
    awayHistory: previousAway.length ? previousAway : readCachedTeamHistory(fixture.awayId, fixture.away, fixture.leagueId)
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
function readCachedTeamHistory(teamId, teamName, leagueId) {
  const cleanName = decodeHtmlEntities(teamName).trim();
  if (!teamId && !cleanName) return [];
  const identity = teamId || `name:${normalizeTeamName(cleanName)}`;
  const cacheKey = `${identity}:${normalizeTeamName(cleanName) || "unknown"}:${leagueId || "all"}`;
  return readHistoryCache("football", cacheKey);
}

function emitProgress(callback, fixtures, range, competitions, syncLog, historyDiagnostics, loading, phase) {
  if (typeof callback !== "function") return;
  callback({
    fixtures: [...fixtures],
    meta: buildMeta(range, competitions, fixtures, syncLog, historyDiagnostics, loading, phase)
  });
}

function buildMeta(range, competitions, fixtures, syncLog, historyDiagnostics, loading, phase) {
  return {
    sport: "football", from: range.from, to: range.to, competitions: competitions.length, total: fixtures.length,
    syncedAt: new Date().toISOString(), fixturesVerifiedAt: oldestVerificationTime(syncLog), syncLog: syncLog.map(item => ({ ...item })),
    historyDiagnostics: { ...historyDiagnostics }, loading, phase
  };
}

async function fetchTeamHistory(teamId, teamName, leagueId, season, diagnostics, memo) {
  const cleanName = decodeHtmlEntities(teamName).trim();
  if (!teamId && !cleanName) return [];
  const identity = teamId || `name:${normalizeTeamName(cleanName)}`;
  const key = `${identity}:${leagueId || "all"}:${season || "auto"}`;
  if (memo.has(key)) return memo.get(key);

  const cacheKey = `${identity}:${normalizeTeamName(cleanName) || "unknown"}:${leagueId || "all"}`;
  const cached = readHistoryCache("football", cacheKey);
  if (cached.length) { diagnostics.cacheFallback += 1; diagnostics.gamesLoaded += cached.length; return cached; }

  const promise = (async () => {
    diagnostics.requested += 1;
    try {
      const data = await fetchFromWorker("/football/team-fixtures", { team: teamId || undefined, teamName: cleanName || undefined, league: leagueId, season, limit: HISTORY_LIMIT }, { attempts: 1, rateLimitRetries: 0 });
      const history = Array.isArray(data?.response) ? data.response : [];
      if (history.length) { diagnostics.apiSuccess += 1; diagnostics.gamesLoaded += history.length; writeHistoryCache("football", cacheKey, history); return history; }
      diagnostics.emptyResponses += 1;
    } catch (error) { diagnostics.errors += 1; console.warn("Football history error:", identity, cleanName, error); }
    return [];
  })();

  memo.set(key, promise);
  return promise;
}

async function mapWithConcurrency(items, limit, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => { while (nextIndex < items.length) { const index = nextIndex++; results[index] = await mapper(items[index], index); } });
  await Promise.all(workers);
  return results;
}

function createHistoryDiagnostics() { return { requested: 0, apiSuccess: 0, cacheFallback: 0, emptyResponses: 0, errors: 0, gamesLoaded: 0 }; }

function normalizeFootballFixtures(items, competition) {
  return items.map(item => ({
    id: item.id, homeId: item.homeId || null, awayId: item.awayId || null,
    homeLogo: item.homeLogo || (item.homeId ? `https://media.api-sports.io/football/teams/${item.homeId}.png` : ""),
    awayLogo: item.awayLogo || (item.awayId ? `https://media.api-sports.io/football/teams/${item.awayId}.png` : ""),
    home: decodeHtmlEntities(item.home), away: decodeHtmlEntities(item.away),
    competition: decodeHtmlEntities(item.competition || competition.name), leagueId: item.leagueId || competition.id,
    season: item.season || null, date: item.date, status: item.status || null, source: "DrawHunter", sport: "football", homeHistory: [], awayHistory: []
  }));
}

function decodeHtmlEntities(value) { return String(value || "").replace(/&apos;|&#39;|&#039;/gi, "'").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&nbsp;/gi, " "); }
function normalizeTeamName(value) { return decodeHtmlEntities(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/&/g, " and ").replace(/\b(rugby|football|club|union|team)\b/g, " ").replace(/[^a-z0-9]+/g, " ").trim(); }

function classifyFootballError(error) {
  const status = Number(error?.status || 0); const message = String(error?.message || "");
  if (status === 401 || /key|token|unauthor/i.test(message)) return "Clé API Football refusée ou absente.";
  if (status === 429 || /rate.?limit|too many requests|requests per minute|quota|limit/i.test(message) || error?.code === "API_SPORTS_RATE_LIMIT") return "Limite temporaire de requêtes API Football atteinte. SportLab ralentit automatiquement les appels.";
  if (status === 403 || /plan|subscription|access/i.test(message)) return "Abonnement API Football insuffisant pour cette ressource.";
  if (/season/i.test(message)) return "Saison football introuvable ou non transmise.";
  if (/abort|timeout/i.test(message)) return "Délai de réponse dépassé.";
  return "Échec de la récupération des rencontres football.";
}

function oldestVerificationTime(syncLog) {
  const times = syncLog.map(item => Date.parse(item.verifiedAt || "")).filter(Number.isFinite);
  return times.length ? new Date(Math.min(...times)).toISOString() : null;
}
