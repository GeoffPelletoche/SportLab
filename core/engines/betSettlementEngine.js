import {
    getBets,
    updateBetSettlement
} from "./stores/betsStore.js";

/*
 * Remplace cette URL uniquement si l'adresse de ton Worker est différente.
 */
const WORKER_BASE_URL =
    "https://sportlab-api-bridge.geoffrey-pelletier.workers.dev";

/**
 * Recherche les paris terminés susceptibles d'être réglés,
 * puis récupère leur résultat officiel.
 *
 * Cette version ne modifie pas encore betsStore.
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

    /*
     * Traitement volontairement séquentiel :
     * un seul appel Worker à la fois.
     */
    for (const bet of pendingBets) {
        const report = await checkPendingBet(bet);
        reports.push(report);
    }

    return reports;
}

/**
 * Sélectionne uniquement :
 * - les paris placés ;
 * - encore PENDING ;
 * - dont la date du match est passée.
 */
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

/**
 * Récupère le résultat officiel d’un pari éligible
 * et met à jour le pari lorsqu’un règlement définitif est possible.
 */ 

async function checkPendingBet(bet) {
    const baseReport = {
        betId: bet.id || null,
        matchId: bet.matchId || null,
        match: bet.match || null,
        sport: bet.sport || null,
        status: "SKIPPED",
        game: null,
        error: null
    };

    if (normalizeSport(bet.sport) !== "rugby") {
        return {
            ...baseReport,
            error: "SPORT_NOT_SUPPORTED"
        };
    }

    if (!bet.matchId) {
        console.warn(
            `[Settlement] Match ID manquant pour ${bet.match || "pari inconnu"}.`
        );

        return {
            ...baseReport,
            error: "MISSING_MATCH_ID"
        };
    }

    try {
        const game = await fetchRugbyGameResult(bet.matchId);

        console.log(
            `[Settlement] ${bet.match || bet.matchId}`,
            game
        );

const settlement = evaluateBetResult(bet, game);

const finalResults = [
    "WON",
    "LOST",
    "PUSH"
];

if (!finalResults.includes(settlement)) {
    return {
        ...baseReport,
        status: game.isFinished
            ? "NOT_SETTLED"
            : "WAITING",
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

console.log(
    `[Settlement] Pari réglé : ${bet.match}`,
    settlement
);

return {
    ...baseReport,
    status: "SETTLED",
    settlement,
    game,
    updatedBet
};
    } catch (error) {
        console.error(
            `[Settlement] Erreur pour ${bet.match || bet.matchId}:`,
            error
        );

        return {
            ...baseReport,
            status: "ERROR",
            error:
                error instanceof Error
                    ? error.message
                    : "UNKNOWN_ERROR"
        };
    }
}

/**
 * Appelle :
 * /rugby/game-result?id=...
 */
async function fetchRugbyGameResult(matchId) {
    const url =
        `${WORKER_BASE_URL}/rugby/game-result` +
        `?id=${encodeURIComponent(matchId)}`;

    const response = await fetch(url, {
        method: "GET",
        headers: {
            Accept: "application/json"
        }
    });

    let payload = null;

    try {
        payload = await response.json();
    } catch {
        throw new Error(`INVALID_JSON_RESPONSE_${response.status}`);
    }

    if (!response.ok) {
        const apiError =
            payload?.error ||
            payload?.message ||
            `HTTP_${response.status}`;

        throw new Error(apiError);
    }

    const game = payload?.response;

    if (!game || typeof game !== "object") {
        throw new Error("INVALID_GAME_RESULT");
    }

    return {
        id: game.id ?? matchId,
        competition: game.competition || null,
        date: game.date || null,
        status: game.status || null,
        isFinished: game.isFinished === true,

        home: game.home || null,
        away: game.away || null,

        homePoints: toNullableNumber(game.homePoints),
        awayPoints: toNullableNumber(game.awayPoints),
        totalPoints: toNullableNumber(game.totalPoints)
    };
}

function normalizeResult(result) {
    return String(result || "")
        .trim()
        .toUpperCase();
}

function normalizeSport(sport) {
    return String(sport || "")
        .trim()
        .toLowerCase();
}

function toNullableNumber(value) {
    if (value === null || value === undefined || value === "") {
        return null;
    }

    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : null;
}
function evaluateBetResult(bet, game) {
    if (!game?.isFinished) {
        return "PENDING";
    }

    const market = String(bet.market || "").toUpperCase();

    if (!market.includes("OVER") && !market.includes("UNDER")) {
        return "UNKNOWN_MARKET";
    }

    const line = Number(bet.line);

    if (!Number.isFinite(line)) {
        return "INVALID_LINE";
    }

    const total = Number(game.totalPoints);

    if (!Number.isFinite(total)) {
        return "INVALID_SCORE";
    }

    if (market.includes("OVER")) {
        if (total > line) return "WON";
        if (total < line) return "LOST";
        return "PUSH";
    }

    if (market.includes("UNDER")) {
        if (total < line) return "WON";
        if (total > line) return "LOST";
        return "PUSH";
    }

    return "UNKNOWN_MARKET";
}
