import {
  getBets,
  updateBetSettlement
} from "../stores/betsStore.js";

const WORKER_BASE_URL =
  "https://sportlab-api-bridge.geoffrey-pelletier.workers.dev";

/**
 * V11.3.1 — règlement automatique unifié Rugby + Football.
 */
export async function settlePendingBets() {
  const bets = getBets();

  if (!Array.isArray(bets) || bets.length === 0) {
    console.log("[Settlement] Aucun pari enregistré.");
    return [];
  }

  const pendingBets = getEligiblePendingBets(bets);

  if (pendingBets.length === 0) {
    console.log("[Settlement] Aucun pari à vérifier.");
    return [];
  }

  const reports = [];

  // Séquentiel pour ne pas saturer le Worker/API-Sports.
  for (const bet of pendingBets) {
    reports.push(await checkPendingBet(bet));
  }

  return reports;
}

function getEligiblePendingBets(bets) {
  const now = Date.now();

  return bets.filter(bet => {
    if (bet?.placed !== true) return false;
    if (normalizeResult(bet?.result) !== "PENDING") return false;
    if (!bet?.matchDate) return false;

    const matchTime = new Date(bet.matchDate).getTime();
    return Number.isFinite(matchTime) && matchTime <= now;
  });
}

async function checkPendingBet(bet) {
  const sport = normalizeSport(bet?.sport);
  const baseReport = {
    betId: bet?.id || null,
    matchId: bet?.matchId || null,
    match: bet?.match || null,
    sport: sport || null,
    status: "SKIPPED",
    game: null,
    error: null
  };

  if (!["rugby", "football"].includes(sport)) {
    return { ...baseReport, error: "SPORT_NOT_SUPPORTED" };
  }

  if (!bet?.matchId) {
    return { ...baseReport, error: "MISSING_MATCH_ID" };
  }

  try {
    const game = sport === "football"
      ? await fetchFootballGameResult(bet.matchId)
      : await fetchRugbyGameResult(bet.matchId);

    const settlement = evaluateBetResult(bet, game);
    const finalResults = ["WON", "LOST", "PUSH"];

    if (!finalResults.includes(settlement)) {
      return {
        ...baseReport,
        status: game.isFinished ? "NOT_SETTLED" : "WAITING",
        settlement,
        game
      };
    }

    const updatedBet = updateBetSettlement(
      bet.id,
      settlement,
      game
    );

    if (!updatedBet) {
      return {
        ...baseReport,
        status: "UPDATE_ERROR",
        settlement,
        game,
        error: "BET_UPDATE_FAILED"
      };
    }

    return {
      ...baseReport,
      status: "SETTLED",
      settlement,
      game,
      updatedBet
    };
  } catch (error) {
    console.error(
      `[Settlement] Erreur pour ${bet?.match || bet?.matchId}:`,
      error
    );

    return {
      ...baseReport,
      status: "ERROR",
      error: error instanceof Error ? error.message : "UNKNOWN_ERROR"
    };
  }
}

async function fetchRugbyGameResult(matchId) {
  const payload = await fetchWorkerResult(
    "/rugby/game-result",
    matchId
  );
  const game = payload?.response;

  if (!game || typeof game !== "object") {
    throw new Error("INVALID_GAME_RESULT");
  }

  return {
    id: game.id ?? matchId,
    sport: "rugby",
    competition: game.competition || null,
    date: game.date || null,
    status: game.status || null,
    isFinished: game.isFinished === true,
    home: game.home || null,
    away: game.away || null,
    homePoints: toNullableNumber(game.homePoints),
    awayPoints: toNullableNumber(game.awayPoints),
    totalPoints: toNullableNumber(game.totalPoints),
    isDraw: null
  };
}

async function fetchFootballGameResult(matchId) {
  const payload = await fetchWorkerResult(
    "/football/game-result",
    matchId
  );
  const game = payload?.response;

  if (!game || typeof game !== "object") {
    throw new Error("INVALID_GAME_RESULT");
  }

  const homeGoals = toNullableNumber(game.homeGoals);
  const awayGoals = toNullableNumber(game.awayGoals);

  return {
    id: game.id ?? matchId,
    sport: "football",
    competition: game.competition || null,
    date: game.date || null,
    status: game.status || null,
    isFinished: game.isFinished === true,
    home: game.home || null,
    away: game.away || null,
    // Le BetsStore utilise les noms génériques *Points* pour les deux sports.
    homePoints: homeGoals,
    awayPoints: awayGoals,
    totalPoints:
      Number.isFinite(homeGoals) && Number.isFinite(awayGoals)
        ? homeGoals + awayGoals
        : null,
    homeGoals,
    awayGoals,
    isDraw:
      typeof game.isDraw === "boolean"
        ? game.isDraw
        : Number.isFinite(homeGoals) && Number.isFinite(awayGoals)
          ? homeGoals === awayGoals
          : null
  };
}

async function fetchWorkerResult(path, matchId) {
  const url =
    `${WORKER_BASE_URL}${path}` +
    `?id=${encodeURIComponent(matchId)}`;

  const response = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store"
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    throw new Error(`INVALID_JSON_RESPONSE_${response.status}`);
  }

  if (!response.ok) {
    throw new Error(
      payload?.error || payload?.message || `HTTP_${response.status}`
    );
  }

  return payload;
}

function evaluateBetResult(bet, game) {
  if (!game?.isFinished) return "PENDING";

  const market = String(bet?.market || "")
    .trim()
    .toUpperCase();

  // DrawHunter — marché match nul.
  if (
    market === "DRAW" ||
    market === "NUL" ||
    market.includes("MATCH NUL")
  ) {
    if (typeof game.isDraw !== "boolean") {
      return "INVALID_SCORE";
    }
    return game.isDraw ? "WON" : "LOST";
  }

  // FrenchFlair — Over / Under.
  if (!market.includes("OVER") && !market.includes("UNDER")) {
    return "UNKNOWN_MARKET";
  }

  const line = Number(bet?.line);
  if (!Number.isFinite(line)) return "INVALID_LINE";

  const total = Number(game?.totalPoints);
  if (!Number.isFinite(total)) return "INVALID_SCORE";

  if (market.includes("OVER")) {
    if (total > line) return "WON";
    if (total < line) return "LOST";
    return "PUSH";
  }

  if (total < line) return "WON";
  if (total > line) return "LOST";
  return "PUSH";
}

function normalizeResult(result) {
  return String(result || "").trim().toUpperCase();
}

function normalizeSport(sport) {
  return String(sport || "").trim().toLowerCase();
}

function toNullableNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}
