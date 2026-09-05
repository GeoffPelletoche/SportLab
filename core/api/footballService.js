import { CONFIG } from "../config/config.js";
import { fetchFromWorker, getDateRange } from "./apiClient.js";
import { readHistoryCache, writeHistoryCache } from "./historyCache.js";

const HISTORY_LIMIT = 30;
const HISTORY_CONCURRENCY = 2;

export async function fetchUpcomingFootballFixtures() {
  const range = getDateRange(CONFIG.analysisWindowDays);
  const activeCompetitions = CONFIG.drawhunter.competitions.filter(c => c.active);
  const allFixtures = [];
  const syncLog = [];
  const historyDiagnostics = createHistoryDiagnostics();
  const requestMemo = new Map();

  for (const competition of activeCompetitions) {
    try {
      const data = await fetchFromWorker("/football/fixtures", {
        league: competition.id,
        from: range.from,
        to: range.to
      });
      const fixtures = normalizeFootballFixtures(data?.response || [], competition);
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
      const status = enrichedFixtures.length > 0 ? "OK" : "EMPTY";
      syncLog.push({
        competition: competition.name,
        leagueId: competition.id,
        status,
        source: data?.source || "unknown",
        count: enrichedFixtures.length,
        season: data?.season ?? null,
        message: status === "EMPTY"
          ? "Aucune rencontre dans la fenêtre d’analyse."
          : null
      });
    } catch (error) {
      syncLog.push({
        competition: competition.name,
        leagueId: competition.id,
        status: "ERROR",
        source: "api",
        count: 0,
        message: error.message,
        code: error?.code || null,
        httpStatus: error?.status || null,
        detail: classifyFootballError(error)
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
      historyDiagnostics
    }
  };
}

async function fetchTeamHistory(teamId, teamName, leagueId, season, diagnostics, memo) {
  const cleanName = decodeHtmlEntities(teamName).trim();
  if (!teamId && !cleanName) return [];
  const identity = teamId || `name:${normalizeTeamName(cleanName)}`;
  const key = `${identity}:${leagueId || "all"}:${season || "auto"}`;
  if (memo.has(key)) return memo.get(key);

  const cacheKey = `${identity}:${normalizeTeamName(cleanName) || "unknown"}:${leagueId || "all"}`;
  const promise = (async () => {
    diagnostics.requested += 1;
    try {
      const data = await fetchFromWorker("/football/team-fixtures", {
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
        writeHistoryCache("football", cacheKey, history);
        return history;
      }
      diagnostics.emptyResponses += 1;
    } catch (error) {
      diagnostics.errors += 1;
      console.warn("Football history error:", identity, cleanName, error);
    }

    const cached = readHistoryCache("football", cacheKey);
    if (cached.length) {
      diagnostics.cacheFallback += 1;
      diagnostics.gamesLoaded += cached.length;
      return cached;
    }
    return [];
  })();

  memo.set(key, promise);
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

function normalizeFootballFixtures(items, competition) {
  return items.map(item => ({
    id: item.id,
    homeId: item.homeId || null,
    awayId: item.awayId || null,
    homeLogo: item.homeLogo || (item.homeId ? `https://media.api-sports.io/football/teams/${item.homeId}.png` : ""),
    awayLogo: item.awayLogo || (item.awayId ? `https://media.api-sports.io/football/teams/${item.awayId}.png` : ""),
    home: decodeHtmlEntities(item.home),
    away: decodeHtmlEntities(item.away),
    competition: decodeHtmlEntities(item.competition || competition.name),
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


function classifyFootballError(error) {
  const status = Number(error?.status || 0);
  const message = String(error?.message || "");
  if (status === 401 || /key|token|unauthor/i.test(message)) {
    return "Clé API Football refusée ou absente.";
  }
  if (status === 429 || /rate.?limit|too many requests|requests per minute|quota|limit/i.test(message) || error?.code === "API_SPORTS_RATE_LIMIT") {
    return "Limite temporaire de requêtes API Football atteinte. SportLab ralentit automatiquement les appels.";
  }
  if (status === 403 || /plan|subscription|access/i.test(message)) {
    return "Abonnement API Football insuffisant pour cette ressource.";
  }
  if (/season/i.test(message)) {
    return "Saison football introuvable ou non transmise.";
  }
  if (/abort|timeout/i.test(message)) {
    return "Délai de réponse dépassé.";
  }
  return "Échec de la récupération des rencontres football.";
}
