/******************************************************************
 * SPORTLAB API BRIDGE
 * Version : 3.9.3
 *
 * Added:
 * - Historique glissant de 30 matchs par défaut
 * - Historique football multi-saisons
 * - Route /football/team-fixtures
 * - Pondération temporelle continue des historiques
 * - Cache football V8 et historique rugby V8
 * - Détection robuste des saisons football et rugby
 * - Improved API-Sports error handling
 * - Correctif historique rugby par équipe
 * - Résultats football pour évaluation des prédictions
 * - Cache historique V9 anti-réponse vide
 *
 * Compatible:
 * - SportLab V9
 * - DrawHunter V9
 * - FrenchFlair V9
 ******************************************************************/

const VERSION = "3.9.3";
const DEFAULT_HISTORY_LIMIT = 30;
const MAX_HISTORY_LIMIT = 50;
const HISTORY_SEASONS_DEPTH = 5;
const RECENCY_WEIGHT_STEP = 0.03;
const MIN_RECENCY_WEIGHT = 0.40;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    /*
     * Réponse aux requêtes CORS envoyées par le navigateur.
     */
    if (request.method === "OPTIONS") {
      return corsResponse({});
    }

    try {
      /*
       * Route principale.
       */
      if (path === "/") {
        return corsResponse({
          status: "SPORTLAB WORKER OK",
          version: VERSION
        });
      }

      /*
       * Numéro de version du Worker.
       */
      if (path === "/version") {
        return corsResponse({
          version: VERSION
        });
      }

      /*
       * État général du Worker et de ses variables.
       */
      if (path === "/health") {
        return corsResponse({
          worker: "OK",
          kv: env.SPORTLAB_KV
            ? "OK"
            : "MISSING",

          football: env.API_SPORTS_KEY
            ? "READY"
            : "MISSING_API_KEY",

          rugby: env.API_SPORTS_KEY
            ? "READY"
            : "MISSING_API_KEY"
        });
      }

      /*
       * Football.
       */
      if (path === "/football/fixtures") {
        return await handleFootballFixtures(url, env);
      }

      if (path === "/football/team-fixtures") {
        return await handleFootballTeamFixtures(url, env);
      }

      if (path === "/football/game-result") {
        return await handleFootballGameResult(url, env);
      }

      /*
       * Rugby.
       */
      if (path === "/rugby/fixtures") {
        return await handleRugbyFixtures(url, env);
      }

      if (path === "/rugby/leagues") {
        return await handleRugbyLeagues(env);
      }

      if (path === "/rugby/debug-games") {
        return await handleRugbyDebugGames(url, env);
      }

      if (path === "/rugby/team-games") {
        return await handleRugbyTeamGames(url, env);
      }

      if (path === "/rugby/game-result") {
        return await handleRugbyGameResult(url, env);
      }

      /*
       * Paris enregistrés.
       */
      if (
        path === "/bets" &&
        request.method === "GET"
      ) {
        return await handleGetBets(env);
      }

      if (
        path === "/bets" &&
        request.method === "POST"
      ) {
        return await handleSaveBets(request, env);
      }

      return corsResponse(
        {
          error: "NOT_FOUND",
          path
        },
        404
      );
    } catch (error) {
      return corsResponse(
        {
          error: "WORKER_ERROR",
          message: error instanceof Error
            ? error.message
            : String(error)
        },
        500
      );
    }
  }
};

/**
 * ================================================================
 * FOOTBALL FIXTURES
 * ================================================================
 */
async function handleFootballFixtures(url, env) {
  const league =
    url.searchParams.get("league");

  const from =
    url.searchParams.get("from");

  const to =
    url.searchParams.get("to");

  if (!league || !from || !to) {
    return corsResponse(
      {
        error: "MISSING_PARAMS",
        required: [
          "league",
          "from",
          "to"
        ]
      },
      400
    );
  }

  const cacheKey =
    `football:v3:${league}:${from}:${to}`;

  const cached =
    await getCache(env, cacheKey);

  if (cached) {
    return corsResponse({
      source: "cache",
      response: cached
    });
  }

  const apiUrl =
    "https://v3.football.api-sports.io/fixtures" +
    `?league=${encodeURIComponent(league)}` +
    `&from=${encodeURIComponent(from)}` +
    `&to=${encodeURIComponent(to)}`;

  const data =
    await fetchApiSports(apiUrl, env);

  const rawFixtures =
    Array.isArray(data.response)
      ? data.response
      : [];

  const normalized =
    normalizeFootballFixtures(
      rawFixtures,
      league
    );

  await setCache(
    env,
    cacheKey,
    normalized
  );

  return corsResponse({
    source: "api",
    league,
    from,
    to,
    rawResults:
      data.results ?? rawFixtures.length,
    rawErrors:
      data.errors || [],
    response:
      normalized
  });
}

/**
 * ================================================================
 * FOOTBALL TEAM FIXTURES — HISTORIQUE MULTI-SAISONS V8
 * ================================================================
 *
 * Récupère les derniers matchs officiels terminés d'une équipe,
 * sans s'arrêter à la frontière d'une saison.
 *
 * Exemples :
 * /football/team-fixtures?team=85&league=61
 * /football/team-fixtures?team=85&league=61&season=2025&limit=30
 */
async function handleFootballTeamFixtures(url, env) {
  const team =
    url.searchParams.get("team");

  const league =
    url.searchParams.get("league");

  const teamName =
    url.searchParams.get("teamName");

  const explicitSeason =
    url.searchParams.get("season");

  const requestedLimit =
    Number(
      url.searchParams.get("limit") ||
      DEFAULT_HISTORY_LIMIT
    );

  const limit =
    Number.isFinite(requestedLimit) &&
    requestedLimit > 0
      ? Math.min(
          Math.floor(requestedLimit),
          MAX_HISTORY_LIMIT
        )
      : DEFAULT_HISTORY_LIMIT;

  if (!team && !teamName) {
    return corsResponse(
      {
        error: "MISSING_PARAMS",
        required: ["team or teamName"]
      },
      400
    );
  }

  let season =
    explicitSeason || null;

  if (!season && league) {
    season =
      await getCurrentFootballSeason(
        env,
        league
      );
  }

  if (!season) {
    return corsResponse(
      {
        error: "MISSING_SEASON",
        message:
          "Provide season or league with a detectable season",
        team,
        league
      },
      400
    );
  }

  const cacheKey =
    `football:v10:team-fixtures:${team || "name-only"}:${normalizeTeamName(teamName || "unknown")}:${league || "all"}:${season}:${limit}`;

  const cached =
    await getCache(env, cacheKey);

  if (cached) {
    return corsResponse({
      source: "cache",
      team,
      league,
      season,
      limit,
      response: cached
    });
  }

  const rawFixtures =
    await fetchFootballTeamFixturesRaw(
      env,
      {
        team,
        teamName,
        league,
        season,
        limit
      }
    );

  const normalized =
    normalizeFootballTeamFixtures(
      rawFixtures,
      team,
      teamName
    )
      .filter(
        fixture =>
          isFinishedFootballStatus(
            fixture.status
          )
      )
      .sort(
        (a, b) =>
          new Date(b.date) -
          new Date(a.date)
      )
      .slice(0, limit);

  const weighted =
    applyRecencyWeights(normalized);

  if (weighted.length > 0) {
    await setCache(env, cacheKey, weighted);
  } else {
    await setCacheWithTtl(env, cacheKey, weighted, 60 * 10);
  }

  return corsResponse({
    source: "api",
    team,
    league,
    season,
    limit,
    seasonsDepth: HISTORY_SEASONS_DEPTH,
    rawResults: rawFixtures.length,
    response: weighted
  });
}

/**
 * Récupération brute de l'historique football sur plusieurs saisons.
 */
async function fetchFootballTeamFixturesRaw(
  env,
  { team, teamName, league, season, limit = DEFAULT_HISTORY_LIMIT }
) {
  const currentSeason = Number(season);
  if (!Number.isFinite(currentSeason)) return [];

  const seasons = Array.from(
    { length: HISTORY_SEASONS_DEPTH },
    (_, index) => currentSeason - index
  );
  const collectedFixtures = [];
  const knownIds = new Set();
  const targetName = normalizeTeamName(teamName || "");

  for (const seasonToFetch of seasons) {
    const urls = [];
    if (league) {
      urls.push(
        "https://v3.football.api-sports.io/fixtures" +
        `?league=${encodeURIComponent(league)}` +
        `&season=${encodeURIComponent(seasonToFetch)}`
      );
    }
    if (team) {
      let directUrl =
        "https://v3.football.api-sports.io/fixtures" +
        `?team=${encodeURIComponent(team)}` +
        `&season=${encodeURIComponent(seasonToFetch)}`;
      if (league) directUrl += `&league=${encodeURIComponent(league)}`;
      urls.push(directUrl);
    }

    for (const apiUrl of urls) {
      const data = await fetchApiSports(apiUrl, env);
      const fixtures = Array.isArray(data.response) ? data.response : [];
      let matched = 0;
      for (const fixture of fixtures) {
        const homeId = fixture.teams?.home?.id;
        const awayId = fixture.teams?.away?.id;
        const homeName = fixture.teams?.home?.name || "";
        const awayName = fixture.teams?.away?.name || "";
        const byId = team && (String(homeId) === String(team) || String(awayId) === String(team));
        const byName = targetName && (normalizeTeamName(homeName) === targetName || normalizeTeamName(awayName) === targetName);
        if (!byId && !byName) continue;
        const fixtureId = fixture.fixture?.id || fixture.id || `${seasonToFetch}-${fixture.fixture?.date || fixture.date}-${homeId}-${awayId}`;
        if (knownIds.has(String(fixtureId))) continue;
        knownIds.add(String(fixtureId));
        collectedFixtures.push(fixture);
        matched += 1;
      }
      if (matched > 0) break;
    }

    const finishedCount = collectedFixtures.filter(fixture =>
      isFinishedFootballStatus(
        fixture.fixture?.status?.short || fixture.status?.short || fixture.status || ""
      )
    ).length;
    if (finishedCount >= limit) break;
  }
  return collectedFixtures;
}

/**
 * Détection de la saison football courante pour une ligue.
 */
async function getCurrentFootballSeason(
  env,
  leagueId
) {
  const cacheKey =
    `football:v8:league-seasons:${leagueId}`;

  const cached =
    await getCache(env, cacheKey);

  if (cached?.season) {
    return cached.season;
  }

  const apiUrl =
    "https://v3.football.api-sports.io/leagues" +
    `?id=${encodeURIComponent(leagueId)}`;

  const data =
    await fetchApiSports(
      apiUrl,
      env
    );

  const league =
    Array.isArray(data.response)
      ? data.response[0]
      : null;

  const seasons =
    Array.isArray(league?.seasons)
      ? league.seasons
      : [];

  const current =
    seasons.find(
      item =>
        item.current === true
    );

  const fallback =
    [...seasons]
      .filter(
        item =>
          Number.isFinite(
            Number(item.year)
          )
      )
      .sort(
        (a, b) =>
          Number(b.year) -
          Number(a.year)
      )[0];

  const detectedSeason =
    current?.year ??
    fallback?.year ??
    null;

  if (detectedSeason !== null) {
    await setCache(
      env,
      cacheKey,
      {
        season: detectedSeason
      }
    );
  }

  return detectedSeason;
}

/**
 * ================================================================
 * FOOTBALL GAME RESULT — ÉVALUATION DES PRÉDICTIONS V9
 * ================================================================
 */
async function handleFootballGameResult(url, env) {
  const fixtureId = url.searchParams.get("id");

  if (!fixtureId) {
    return corsResponse({ error: "MISSING_PARAMS", required: ["id"] }, 400);
  }

  const cacheKey = `football:v9:game-result:${fixtureId}`;
  const cached = await getCache(env, cacheKey);

  if (cached) {
    return corsResponse({ source: "cache", response: cached });
  }

  const apiUrl =
    "https://v3.football.api-sports.io/fixtures" +
    `?id=${encodeURIComponent(fixtureId)}`;

  const data = await fetchApiSports(apiUrl, env);
  const items = Array.isArray(data?.response) ? data.response : [];

  if (!items.length) {
    return corsResponse({
      source: "api",
      error: "FIXTURE_NOT_FOUND",
      fixtureId,
      rawErrors: data?.errors || [],
      response: null
    }, 404);
  }

  const item = items[0];
  const status = item.fixture?.status?.short || null;
  const homeGoals = toNullableNumber(item.goals?.home);
  const awayGoals = toNullableNumber(item.goals?.away);
  const hasScores = Number.isFinite(homeGoals) && Number.isFinite(awayGoals);
  const isFinished = isFinishedFootballStatus(status) && hasScores;

  const result = {
    id: item.fixture?.id || Number(fixtureId),
    sport: "football",
    competition: item.league?.name || null,
    leagueId: item.league?.id || null,
    season: item.league?.season || null,
    date: item.fixture?.date || null,
    status,
    isFinished,
    homeId: item.teams?.home?.id || null,
    home: item.teams?.home?.name || null,
    awayId: item.teams?.away?.id || null,
    away: item.teams?.away?.name || null,
    homeGoals,
    awayGoals,
    totalGoals: hasScores ? homeGoals + awayGoals : null,
    isDraw: hasScores ? homeGoals === awayGoals : null
  };

  await setCacheWithTtl(
    env,
    cacheKey,
    result,
    isFinished ? 60 * 60 * 24 * 30 : 60 * 15
  );

  return corsResponse({
    source: "api",
    fixtureId,
    rawResults: data?.results ?? items.length,
    rawErrors: data?.errors || [],
    response: result
  });
}

/**
 * ================================================================
 * RUGBY FIXTURES
 * ================================================================
 *
 * L’API Rugby renvoie les matchs d’une saison complète.
 * Le Worker sélectionne la saison, récupère les matchs,
 * puis filtre la période demandée côté Worker.
 */
async function handleRugbyFixtures(url, env) {
  const league =
    url.searchParams.get("league");

  const from =
    url.searchParams.get("from");

  const to =
    url.searchParams.get("to");

  if (!league || !from || !to) {
    return corsResponse(
      {
        error: "MISSING_PARAMS",
        required: [
          "league",
          "from",
          "to"
        ]
      },
      400
    );
  }

  const season =
    await getCurrentRugbySeason(
      env,
      league,
      from,
      to
    );

  if (!season) {
    return corsResponse({
      source: "api",
      warning: "NO_CURRENT_SEASON_FOUND",
      league,
      from,
      to,
      response: []
    });
  }

  const cacheKey =
    `rugby:v7:fixtures:${league}:${season}:${from}:${to}`;

  const cached =
    await getCache(env, cacheKey);

  if (cached) {
    return corsResponse({
      source: "cache",
      league,
      season,
      from,
      to,
      response: cached
    });
  }

  const apiUrl =
    "https://v1.rugby.api-sports.io/games" +
    `?league=${encodeURIComponent(league)}` +
    `&season=${encodeURIComponent(season)}`;

  const data =
    await fetchApiSports(apiUrl, env);

  const rawGames =
    Array.isArray(data.response)
      ? data.response
      : [];

  const filteredGames =
    filterGamesByDateRange(
      rawGames,
      from,
      to
    );

  const normalized =
    normalizeRugbyFixtures(
      filteredGames,
      league,
      season
    );

  await setCache(
    env,
    cacheKey,
    normalized
  );

  return corsResponse({
    source: "api",
    league,
    season,
    from,
    to,

    rawResults:
      data.results ?? rawGames.length,

    filteredResults:
      normalized.length,

    rawErrors:
      data.errors || [],

    response:
      normalized
  });
}

/**
 * ================================================================
 * RUGBY LEAGUES — DIAGNOSTIC
 * ================================================================
 */
async function handleRugbyLeagues(env) {
  const leagues =
    await getRugbyLeagues(env);

  return corsResponse({
    source: "api",
    total: leagues.length,
    response: leagues
  });
}

/**
 * ================================================================
 * RUGBY DEBUG GAMES
 * ================================================================
 *
 * Exemple :
 * /rugby/debug-games?league=80
 *
 * Il est également possible de fournir une période :
 * /rugby/debug-games?league=80&from=2026-07-30&to=2026-08-06
 */
async function handleRugbyDebugGames(url, env) {
  const league =
    url.searchParams.get("league");

  const from =
    url.searchParams.get("from");

  const to =
    url.searchParams.get("to");

  if (!league) {
    return corsResponse(
      {
        error: "MISSING_LEAGUE"
      },
      400
    );
  }

  const season =
    await getCurrentRugbySeason(
      env,
      league,
      from,
      to
    );

  if (!season) {
    return corsResponse(
      {
        error: "NO_CURRENT_SEASON",
        league,
        from: from || null,
        to: to || null
      },
      404
    );
  }

  const apiUrl =
    "https://v1.rugby.api-sports.io/games" +
    `?league=${encodeURIComponent(league)}` +
    `&season=${encodeURIComponent(season)}`;

  const data =
    await fetchApiSports(apiUrl, env);

  return corsResponse({
    source: "api",
    league,
    season,
    apiUrl,

    results:
      data.results ?? 0,

    errors:
      data.errors || [],

    paging:
      data.paging || {},

    response:
      Array.isArray(data.response)
        ? data.response
        : []
  });
}
/**
 * ================================================================
 * RUGBY TEAM GAMES
 * ================================================================
 *
 * Récupère les derniers matchs joués d’une équipe.
 *
 * Exemples :
 * /rugby/team-games?team=123&league=80
 * /rugby/team-games?team=123&season=2026
 */
async function handleRugbyTeamGames(url, env) {
  const team =
    url.searchParams.get("team");

  const teamName =
    url.searchParams.get("teamName");

  const league =
    url.searchParams.get("league");

  const explicitSeason =
    url.searchParams.get("season");

  const requestedLimit =
    Number(
      url.searchParams.get("limit") ||
      DEFAULT_HISTORY_LIMIT
    );

  const limit =
    Number.isFinite(requestedLimit) &&
    requestedLimit > 0
      ? Math.min(
          Math.floor(requestedLimit),
          MAX_HISTORY_LIMIT
        )
      : DEFAULT_HISTORY_LIMIT;

  if (!team && !teamName) {
    return corsResponse(
      {
        error: "MISSING_PARAMS",
        required: ["team or teamName"]
      },
      400
    );
  }

  let season =
    explicitSeason || null;

  if (!season && league) {
    season =
      await getCurrentRugbySeason(
        env,
        league
      );
  }

  if (!season) {
    return corsResponse(
      {
        error: "MISSING_SEASON",
        message:
          "Provide season or league with a detectable season",
        team,
        league
      },
      400
    );
  }

  const cacheKey =
    `rugby:v11:team-games:${team || "name-only"}:${normalizeTeamName(teamName || "unknown")}:${league || "all"}:${season}:${limit}`;

  const cached =
    await getCache(env, cacheKey);

  if (cached) {
    return corsResponse({
      source: "cache",
      team,
      league,
      season,
      limit,
      response: cached
    });
  }

  const rawGames =
    await fetchRugbyTeamGamesRaw(
      env,
      {
        team,
        teamName,
        league,
        season,
        limit
      }
    );

  const normalized =
    normalizeRugbyTeamGames(
      rawGames,
      team,
      teamName
    )
      .filter(
        game =>
          isFinishedRugbyStatus(
            game.status
          )
      )
      .sort(
        (a, b) =>
          new Date(b.date) -
          new Date(a.date)
      )
      .slice(0, limit);

  const weighted =
    applyRecencyWeights(normalized);

  if (weighted.length > 0) {
    await setCache(env, cacheKey, weighted);
  } else {
    await setCacheWithTtl(env, cacheKey, weighted, 60 * 10);
  }

  return corsResponse({
    source: "api",
    team,
    teamName: teamName || null,
    league,
    season,
    limit,

    rawResults:
      rawGames.length,

    response:
      weighted
  });
}

/**
 * ================================================================
 * RUGBY GAME RESULT
 * ================================================================
 *
 * Récupère un match par son identifiant API.
 *
 * Exemple :
 * /rugby/game-result?id=53220
 */
async function handleRugbyGameResult(url, env) {
  const gameId =
    url.searchParams.get("id");

  if (!gameId) {
    return corsResponse(
      {
        error: "MISSING_PARAMS",
        required: ["id"]
      },
      400
    );
  }

  const cacheKey =
    `rugby:v7:game-result:${gameId}`;

  const cached =
    await getCache(env, cacheKey);

  if (cached) {
    return corsResponse({
      source: "cache",
      response: cached
    });
  }

  const apiUrl =
    "https://v1.rugby.api-sports.io/games" +
    `?id=${encodeURIComponent(gameId)}`;

  const data =
    await fetchApiSports(apiUrl, env);

  const items =
    Array.isArray(data.response)
      ? data.response
      : [];

  if (items.length === 0) {
    return corsResponse(
      {
        source: "api",
        error: "GAME_NOT_FOUND",
        gameId,

        rawErrors:
          data.errors || [],

        response:
          null
      },
      404
    );
  }

  const result =
    normalizeRugbyGameResult(
      items[0]
    );

  /*
   * Match terminé :
   * cache long, car le résultat ne changera plus.
   *
   * Match non terminé :
   * cache court pour éviter de figer trop longtemps
   * un statut NS ou LIVE.
   */
  const ttlSeconds =
    result.isFinished
      ? 60 * 60 * 24 * 30
      : 60 * 15;

  await setCacheWithTtl(
    env,
    cacheKey,
    result,
    ttlSeconds
  );

  return corsResponse({
    source: "api",
    gameId,

    rawResults:
      data.results ?? items.length,

    rawErrors:
      data.errors || [],

    response:
      result
  });
}

/**
 * ================================================================
 * RAW TEAM GAMES FETCH — MULTI-SEASONS
 * ================================================================
 *
 * Récupère les matchs de plusieurs saisons afin de disposer
 * d’un historique même lorsque la saison actuelle vient de commencer.
 */
async function fetchRugbyTeamGamesRaw(
  env,
  {
    team,
    teamName,
    league,
    season,
    limit = DEFAULT_HISTORY_LIMIT
  }
) {
  const currentSeason =
    Number(season);

  if (!Number.isFinite(currentSeason)) {
    return [];
  }

  /*
   * Saison actuelle et saisons précédentes jusqu'à la profondeur V8.
   */
  const seasons =
    Array.from(
      { length: HISTORY_SEASONS_DEPTH },
      (_, index) =>
        currentSeason - index
    );

  const collectedGames = [];
  const knownIds = new Set();

  for (const seasonToFetch of seasons) {
    const urls = [];

    /*
     * Recherche prioritaire par ligue.
     */
    if (league) {
      urls.push(
        "https://v1.rugby.api-sports.io/games" +
        `?league=${encodeURIComponent(league)}` +
        `&season=${encodeURIComponent(seasonToFetch)}`
      );
    }

    /*
     * Recherche directe par équipe en repli.
     */
    if (team) {
      urls.push(
        "https://v1.rugby.api-sports.io/games" +
        `?team=${encodeURIComponent(team)}` +
        `&season=${encodeURIComponent(seasonToFetch)}`
      );
    }

    for (const apiUrl of urls) {
      const data =
        await fetchApiSports(
          apiUrl,
          env
        );

      const games =
        Array.isArray(data.response)
          ? data.response
          : [];

      let matchedForTeam = 0;

      for (const game of games) {
        const homeId =
          game.teams?.home?.id;

        const awayId =
          game.teams?.away?.id;

        const homeName =
          game.teams?.home?.name ||
          (typeof game.teams?.home === "string" ? game.teams.home : "");

        const awayName =
          game.teams?.away?.name ||
          (typeof game.teams?.away === "string" ? game.teams.away : "");

        const targetName = normalizeTeamName(teamName || "");

        const belongsToTeamById =
          String(homeId) === String(team) ||
          String(awayId) === String(team);

        const belongsToTeamByName =
          targetName &&
          (
            normalizeTeamName(homeName) === targetName ||
            normalizeTeamName(awayName) === targetName
          );

        if (!belongsToTeamById && !belongsToTeamByName) {
          continue;
        }

        const gameId =
          game.game?.id ||
          game.id ||
          `${seasonToFetch}-${game.game?.date || game.date}-${homeId}-${awayId}`;

        if (knownIds.has(String(gameId))) {
          continue;
        }

        knownIds.add(
          String(gameId)
        );

        collectedGames.push(game);
        matchedForTeam += 1;
      }

      /*
       * On arrête les essais de la saison uniquement si la requête
       * courante a réellement trouvé des matchs de cette équipe.
       */
      if (matchedForTeam > 0) {
        break;
      }
    }

    /*
     * On arrête dès que l’on dispose d’assez de matchs terminés.
     */
    const finishedCount =
      collectedGames.filter(game => {
        const status =
          game.game?.status?.short ||
          game.status?.short ||
          game.status ||
          "";

        return isFinishedRugbyStatus(
          status
        );
      }).length;

    if (finishedCount >= limit) {
      break;
    }
  }

  return collectedGames;
}

/**
 * ================================================================
 * RUGBY SEASON DETECTION
 * ================================================================
 *
 * Priorités :
 *
 * 1. Saison marquée current=true par API-Sports.
 * 2. Saison qui chevauche la période from/to demandée.
 * 3. Saison couvrant la date actuelle.
 * 4. Dernière saison terminée.
 * 5. Saison future la plus proche.
 */
async function getCurrentRugbySeason(
  env,
  leagueId,
  from = null,
  to = null
) {
  const leagues =
    await getRugbyLeagues(env);

  const league =
    leagues.find(
      item =>
        String(item.id) ===
        String(leagueId)
    );

  if (!league) {
    return null;
  }

  const seasons =
    Array.isArray(league.seasons)
      ? league.seasons
      : [];

  if (seasons.length === 0) {
    return null;
  }

  /*
   * 1. Marqueur officiel API-Sports.
   */
  const officiallyCurrent =
    seasons.find(
      season =>
        season.current === true
    );

  if (officiallyCurrent?.season) {
    return officiallyCurrent.season;
  }

  /*
   * 2. Saison chevauchant la période demandée.
   *
   * Exemple :
   * from = 2026-07-30
   * to   = 2026-08-06
   */
  if (
    from &&
    to &&
    isValidDateString(from) &&
    isValidDateString(to)
  ) {
    const requestedStart =
      new Date(
        `${from}T00:00:00Z`
      );

    const requestedEnd =
      new Date(
        `${to}T23:59:59Z`
      );

    const overlappingSeason =
      seasons.find(season => {
        const range =
          getSeasonDateRange(
            season
          );

        if (!range) {
          return false;
        }

        return (
          range.start <= requestedEnd &&
          range.end >= requestedStart
        );
      });

    if (overlappingSeason?.season) {
      return overlappingSeason.season;
    }
  }

  /*
   * 3. Saison couvrant la date actuelle.
   */
  const now =
    new Date();

  const activeByDate =
    seasons.find(season => {
      const range =
        getSeasonDateRange(
          season
        );

      if (!range) {
        return false;
      }

      return (
        now >= range.start &&
        now <= range.end
      );
    });

  if (activeByDate?.season) {
    return activeByDate.season;
  }

  /*
   * On prépare uniquement les saisons
   * disposant de dates valides.
   */
  const datedSeasons =
    seasons
      .map(season => ({
        season,
        range:
          getSeasonDateRange(
            season
          )
      }))
      .filter(
        item =>
          item.range !== null
      );

  /*
   * 4. Dernière saison terminée.
   *
   * Utile notamment pour récupérer
   * l’historique d’une équipe hors saison.
   */
  const latestPast =
    datedSeasons
      .filter(
        item =>
          item.range.end < now
      )
      .sort(
        (a, b) =>
          b.range.end.getTime() -
          a.range.end.getTime()
      )[0];

  if (latestPast?.season?.season) {
    return latestPast.season.season;
  }

  /*
   * 5. Saison future la plus proche.
   */
  const nearestFuture =
    datedSeasons
      .filter(
        item =>
          item.range.start > now
      )
      .sort(
        (a, b) =>
          a.range.start.getTime() -
          b.range.start.getTime()
      )[0];

  if (nearestFuture?.season?.season) {
    return nearestFuture.season.season;
  }

  /*
   * Dernier repli :
   * saison possédant le numéro le plus élevé.
   */
  const numericFallback =
    [...seasons]
      .filter(
        season =>
          Number.isFinite(
            Number(season.season)
          )
      )
      .sort(
        (a, b) =>
          Number(b.season) -
          Number(a.season)
      )[0];

  if (numericFallback?.season) {
    return numericFallback.season;
  }

  return null;
}

/**
 * Retourne les dates de début et de fin d’une saison.
 */
function getSeasonDateRange(season) {
  if (
    !season?.start ||
    !season?.end
  ) {
    return null;
  }

  const start =
    new Date(
      `${season.start}T00:00:00Z`
    );

  const end =
    new Date(
      `${season.end}T23:59:59Z`
    );

  if (
    Number.isNaN(
      start.getTime()
    ) ||
    Number.isNaN(
      end.getTime()
    )
  ) {
    return null;
  }

  return {
    start,
    end
  };
}

/**
 * ================================================================
 * RUGBY LEAGUES FETCH
 * ================================================================
 */
async function getRugbyLeagues(env) {
  const cacheKey =
    "rugby:v7:leagues";

  const cached =
    await getCache(
      env,
      cacheKey
    );

  if (cached) {
    return cached;
  }

  const apiUrl =
    "https://v1.rugby.api-sports.io/leagues";

  const data =
    await fetchApiSports(
      apiUrl,
      env
    );

  const leagues =
    Array.isArray(data.response)
      ? data.response
      : [];

  await setCache(
    env,
    cacheKey,
    leagues
  );

  return leagues;
}

/**
 * ================================================================
 * BETS
 * ================================================================
 */
async function handleGetBets(env) {
  if (!env.SPORTLAB_KV) {
    return corsResponse(
      {
        error: "KV_MISSING",
        message:
          "SPORTLAB_KV binding is missing"
      },
      500
    );
  }

  const raw =
    await env.SPORTLAB_KV.get(
      "bets_v3"
    );

  let bets = [];

  try {
    bets =
      JSON.parse(
        raw || "[]"
      );
  } catch {
    bets = [];
  }

  return corsResponse(bets);
}

async function handleSaveBets(
  request,
  env
) {
  if (!env.SPORTLAB_KV) {
    return corsResponse(
      {
        error: "KV_MISSING",
        message:
          "SPORTLAB_KV binding is missing"
      },
      500
    );
  }

  let body;

  try {
    body =
      await request.json();
  } catch {
    return corsResponse(
      {
        error: "INVALID_JSON",
        message:
          "Request body must contain valid JSON"
      },
      400
    );
  }

  if (!Array.isArray(body)) {
    return corsResponse(
      {
        error: "INVALID_BODY",
        message:
          "Expected an array of bets"
      },
      400
    );
  }

  await env.SPORTLAB_KV.put(
    "bets_v3",
    JSON.stringify(body)
  );

  return corsResponse({
    status: "SAVED",
    count: body.length
  });
}
/**
 * ================================================================
 * API-SPORTS FETCH
 * ================================================================
 *
 * Vérifie :
 * - la présence de la clé API ;
 * - le statut HTTP ;
 * - la validité du JSON ;
 * - les erreurs métier renvoyées par API-Sports.
 */
async function fetchApiSports(apiUrl, env) {
  if (!env.API_SPORTS_KEY) {
    throw new Error(
      "Missing API_SPORTS_KEY secret"
    );
  }

  const response =
    await fetch(
      apiUrl,
      {
        headers: {
          "x-apisports-key":
            env.API_SPORTS_KEY
        }
      }
    );

  let data;

  try {
    data =
      await response.json();
  } catch {
    throw new Error(
      `API-Sports returned invalid JSON - HTTP ${response.status}`
    );
  }

  if (!response.ok) {
    throw new Error(
      `API-Sports HTTP ${response.status}: ${JSON.stringify(data)}`
    );
  }

  const apiErrors =
    data?.errors;

  const hasArrayErrors =
    Array.isArray(apiErrors) &&
    apiErrors.length > 0;

  const hasObjectErrors =
    apiErrors &&
    !Array.isArray(apiErrors) &&
    typeof apiErrors === "object" &&
    Object.keys(apiErrors).length > 0;

  const hasStringError =
    typeof apiErrors === "string" &&
    apiErrors.trim() !== "";

  if (
    hasArrayErrors ||
    hasObjectErrors ||
    hasStringError
  ) {
    throw new Error(
      `API-Sports error: ${JSON.stringify(apiErrors)}`
    );
  }

  return data;
}

/**
 * ================================================================
 * FOOTBALL NORMALIZER
 * ================================================================
 */
function normalizeFootballFixtures(
  items,
  leagueId
) {
  return items.map(item => ({
    id:
      item.fixture?.id ||
      null,

    sport:
      "football",

    leagueId,

    competition:
      item.league?.name ||
      null,

    date:
      item.fixture?.date ||
      null,

    homeId:
      item.teams?.home?.id ||
      null,

    awayId:
      item.teams?.away?.id ||
      null,

    home:
      item.teams?.home?.name ||
      null,

    away:
      item.teams?.away?.name ||
      null,

    homeGoals:
      item.goals?.home ??
      null,

    awayGoals:
      item.goals?.away ??
      null,

    status:
      item.fixture?.status?.short ||
      null
  }));
}

/**
 * ================================================================
 * FOOTBALL TEAM FIXTURES NORMALIZER
 * ================================================================
 */
function normalizeFootballTeamFixtures(items, teamId, teamName = "") {
  const normalizedTargetName = normalizeTeamName(teamName);
  return items.map(item => {
    const homeId = item.teams?.home?.id || null;
    const awayId = item.teams?.away?.id || null;
    const homeName = decodeBasicHtmlEntities(item.teams?.home?.name || "");
    const awayName = decodeBasicHtmlEntities(item.teams?.away?.name || "");
    const homeGoals = toNullableNumber(item.goals?.home);
    const awayGoals = toNullableNumber(item.goals?.away);
    const isHome =
      (teamId && String(homeId) === String(teamId)) ||
      (normalizedTargetName && normalizeTeamName(homeName) === normalizedTargetName);
    const isAway =
      (teamId && String(awayId) === String(teamId)) ||
      (normalizedTargetName && normalizeTeamName(awayName) === normalizedTargetName);
    if (!isHome && !isAway) return null;
    return {
      id: item.fixture?.id || item.id || null,
      sport: "football",
      date: item.fixture?.date || item.date || null,
      competition: decodeBasicHtmlEntities(item.league?.name || "") || null,
      leagueId: item.league?.id || null,
      season: item.league?.season || null,
      homeId, home: homeName || null, awayId, away: awayName || null,
      homeGoals, awayGoals,
      teamId: teamId ? Number(teamId) : null,
      teamName: isHome ? homeName || null : awayName || null,
      opponentId: isHome ? awayId : homeId,
      opponent: isHome ? awayName || null : homeName || null,
      goalsFor: isHome ? homeGoals : awayGoals,
      goalsAgainst: isHome ? awayGoals : homeGoals,
      totalGoals: Number.isFinite(homeGoals) && Number.isFinite(awayGoals) ? homeGoals + awayGoals : null,
      isDraw: Number.isFinite(homeGoals) && Number.isFinite(awayGoals) ? homeGoals === awayGoals : false,
      isHome,
      status: item.fixture?.status?.short || item.status?.short || item.status || null
    };
  }).filter(Boolean);
}

/**
 * ================================================================
 * RUGBY FIXTURES NORMALIZER
 * ================================================================
 */
function normalizeRugbyFixtures(
  items,
  leagueId,
  season
) {
  return items.map(item => ({
    id:
      item.game?.id ||
      item.id ||
      null,

    sport:
      "rugby",

    leagueId,

    season,

    competition:
      item.league?.name ||
      null,

    date:
      item.game?.date ||
      item.date ||
      null,

    homeId:
      item.teams?.home?.id ||
      null,

    awayId:
      item.teams?.away?.id ||
      null,

    home:
      item.teams?.home?.name ||
      (
        typeof item.teams?.home === "string"
          ? item.teams.home
          : null
      ),

    away:
      item.teams?.away?.name ||
      (
        typeof item.teams?.away === "string"
          ? item.teams.away
          : null
      ),

    homePoints:
      toNullableNumber(
        item.scores?.home
      ),

    awayPoints:
      toNullableNumber(
        item.scores?.away
      ),

    status:
      item.game?.status?.short ||
      item.status?.short ||
      (
        typeof item.status === "string"
          ? item.status
          : null
      )
  }));
}

/**
 * ================================================================
 * RUGBY TEAM GAMES NORMALIZER
 * ================================================================
 */
function normalizeRugbyTeamGames(items, teamId, teamName = "") {
  const normalizedTargetName = normalizeTeamName(teamName);
  return items.map(item => {
    const homeId = item.teams?.home?.id || null;
    const awayId = item.teams?.away?.id || null;
    const homeName = decodeBasicHtmlEntities(item.teams?.home?.name || (typeof item.teams?.home === "string" ? item.teams.home : ""));
    const awayName = decodeBasicHtmlEntities(item.teams?.away?.name || (typeof item.teams?.away === "string" ? item.teams.away : ""));
    const homePoints = toNullableNumber(item.scores?.home);
    const awayPoints = toNullableNumber(item.scores?.away);
    const isHome =
      (teamId && String(homeId) === String(teamId)) ||
      (normalizedTargetName && normalizeTeamName(homeName) === normalizedTargetName);
    const isAway =
      (teamId && String(awayId) === String(teamId)) ||
      (normalizedTargetName && normalizeTeamName(awayName) === normalizedTargetName);
    if (!isHome && !isAway) return null;
    const status = item.game?.status?.short || item.status?.short || (typeof item.status === "string" ? item.status : null);
    return {
      id: item.game?.id || item.id || null,
      date: item.game?.date || item.date || null,
      competition: decodeBasicHtmlEntities(item.league?.name || "") || null,
      leagueId: item.league?.id || null,
      season: item.league?.season || null,
      homeId, home: homeName || null, awayId, away: awayName || null,
      homePoints, awayPoints,
      teamId: teamId ? Number(teamId) : null,
      teamName: isHome ? homeName || null : awayName || null,
      opponentId: isHome ? awayId : homeId,
      opponent: isHome ? awayName || null : homeName || null,
      pointsFor: isHome ? homePoints : awayPoints,
      pointsAgainst: isHome ? awayPoints : homePoints,
      isHome, status
    };
  }).filter(Boolean);
}

/**
 * ================================================================
 * RUGBY GAME RESULT NORMALIZER
 * ================================================================
 */
function normalizeRugbyGameResult(item) {
  const id =
    item?.game?.id ||
    item?.id ||
    null;

  const date =
    item?.game?.date ||
    item?.date ||
    null;

  const status =
    item?.game?.status?.short ||
    item?.status?.short ||
    (
      typeof item?.status === "string"
        ? item.status
        : null
    );

  const homeId =
    item?.teams?.home?.id ||
    null;

  const awayId =
    item?.teams?.away?.id ||
    null;

  const home =
    item?.teams?.home?.name ||
    (
      typeof item?.teams?.home === "string"
        ? item.teams.home
        : null
    );

  const away =
    item?.teams?.away?.name ||
    (
      typeof item?.teams?.away === "string"
        ? item.teams.away
        : null
    );

  const homePoints =
    toNullableNumber(
      item?.scores?.home
    );

  const awayPoints =
    toNullableNumber(
      item?.scores?.away
    );

  const finishedStatuses = [
    "FT",
    "AET",
    "AP"
  ];

  const hasFinalScores =
    Number.isFinite(homePoints) &&
    Number.isFinite(awayPoints);

  const isFinished =
    finishedStatuses.includes(
      String(status)
        .toUpperCase()
    ) &&
    hasFinalScores;

  return {
    id,

    sport:
      "rugby",

    competition:
      item?.league?.name ||
      null,

    leagueId:
      item?.league?.id ||
      null,

    season:
      item?.league?.season ||
      null,

    date,

    status,

    isFinished,

    homeId,

    home,

    awayId,

    away,

    homePoints,

    awayPoints,

    totalPoints:
      hasFinalScores
        ? homePoints + awayPoints
        : null
  };
}

/**
 * ================================================================
 * NUMBER HELPER
 * ================================================================
 */
function toNullableNumber(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const number =
    Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}


function decodeBasicHtmlEntities(value) {
  return String(value || "")
    .replace(/&apos;|&#39;|&#039;/gi, "'")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '\"')
    .replace(/&nbsp;/gi, " ");
}

function normalizeTeamName(value) {
  return decodeBasicHtmlEntities(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\b(rugby|football|club|union|team)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * ================================================================
 * DATE FILTER
 * ================================================================
 */
function filterGamesByDateRange(
  games,
  from,
  to
) {
  const fromDate =
    new Date(
      `${from}T00:00:00Z`
    );

  const toDate =
    new Date(
      `${to}T23:59:59Z`
    );

  return games.filter(game => {
    const rawDate =
      game.date ||
      game.game?.date;

    if (!rawDate) {
      return false;
    }

    const gameDate =
      new Date(rawDate);

    if (
      Number.isNaN(
        gameDate.getTime()
      )
    ) {
      return false;
    }

    return (
      gameDate >= fromDate &&
      gameDate <= toDate
    );
  });
}

/**
 * ================================================================
 * DATE VALIDATION
 * ================================================================
 */
function isValidDateString(value) {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return false;
  }

  const date =
    new Date(
      `${value}T00:00:00Z`
    );

  return !Number.isNaN(
    date.getTime()
  );
}

/**
 * Détermine si un match de football est terminé.
 */
function isFinishedFootballStatus(status) {
  const normalized =
    String(status || "")
      .trim()
      .toUpperCase();

  return [
    "FT",
    "AET",
    "PEN"
  ].includes(normalized);
}

/**
 * Ajoute un poids temporel continu aux matchs triés du plus récent
 * au plus ancien.
 *
 * Match 1 : 1.00
 * Match 2 : 0.97
 * ...
 * Plancher : 0.40
 */
function applyRecencyWeights(items) {
  return items.map(
    (item, index) => ({
      ...item,
      historyRank:
        index + 1,
      recencyWeight:
        Number(
          Math.max(
            MIN_RECENCY_WEIGHT,
            1 - index * RECENCY_WEIGHT_STEP
          ).toFixed(2)
        )
    })
  );
}

/**
 * Détermine si un match de rugby est terminé.
 */
function isFinishedRugbyStatus(status) {
  const normalized =
    String(status || "")
      .trim()
      .toUpperCase();

  return [
    "FT",
    "AET",
    "AP",
    "FINISHED",
    "MATCH FINISHED"
  ].includes(normalized);
}

/**
 * ================================================================
 * CACHE KV
 * ================================================================
 */

/**
 * Lecture d’une valeur en cache.
 *
 * Les valeurs sont stockées sous la forme :
 *
 * {
 *   data: ...,
 *   expiresAt: timestamp
 * }
 */
async function getCache(env, key) {
  if (!env.SPORTLAB_KV) {
    return null;
  }

  const raw =
    await env.SPORTLAB_KV.get(
      `cache:${key}`
    );

  if (!raw) {
    return null;
  }

  try {
    const cached =
      JSON.parse(raw);

    if (
      cached.expiresAt &&
      cached.expiresAt > Date.now()
    ) {
      return cached.data;
    }

    /*
     * La donnée existe encore dans KV,
     * mais elle est expirée.
     */
    return null;
  } catch {
    /*
     * Si le JSON du cache est invalide,
     * on ignore simplement cette valeur.
     */
    return null;
  }
}

/**
 * Écriture standard en cache.
 *
 * Durée par défaut :
 * 6 heures.
 */
async function setCache(
  env,
  key,
  data
) {
  if (!env.SPORTLAB_KV) {
    return;
  }

  const payload = {
    data,

    expiresAt:
      Date.now() +
      1000 * 60 * 60 * 6
  };

  await env.SPORTLAB_KV.put(
    `cache:${key}`,
    JSON.stringify(payload)
  );
}

/**
 * Écriture en cache avec durée personnalisée.
 *
 * Utilisée notamment pour :
 * - les résultats de matchs terminés ;
 * - les matchs non terminés ;
 * - les données nécessitant une durée spécifique.
 */
async function setCacheWithTtl(
  env,
  key,
  data,
  ttlSeconds
) {
  if (!env.SPORTLAB_KV) {
    return;
  }

  const numericTtl =
    Number(ttlSeconds);

  const safeTtlSeconds =
    Number.isFinite(numericTtl) &&
    numericTtl > 0
      ? numericTtl
      : 900;

  const payload = {
    data,

    expiresAt:
      Date.now() +
      safeTtlSeconds * 1000
  };

  await env.SPORTLAB_KV.put(
    `cache:${key}`,
    JSON.stringify(payload)
  );
}

/**
 * ================================================================
 * CORS RESPONSE
 * ================================================================
 */
function corsResponse(
  data,
  status = 200
) {
  return new Response(
    JSON.stringify(data),
    {
      status,

      headers: {
        "Content-Type":
          "application/json; charset=utf-8",

        "Access-Control-Allow-Origin":
          "*",

        "Access-Control-Allow-Methods":
          "GET,POST,OPTIONS",

        "Access-Control-Allow-Headers":
          "Content-Type"
      }
    }
  );
}