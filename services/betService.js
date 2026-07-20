// services/betService.js

import {
    getBets,
    saveBet,
    updateBetSettlement
} from "../core/stores/betsStore.js";

export function getAllBets() {
    const bets = getBets();

    return Array.isArray(bets)
        ? bets
        : [];
}

export function getPlacedBets() {
    return getAllBets().filter(
        bet => bet?.placed === true
    );
}

export function getPendingBets() {
    return getPlacedBets().filter(
        bet => normalizeResult(bet?.result) === "PENDING"
    );
}

export function getSettledBets() {
    return getPlacedBets().filter(bet => {
        const result = normalizeResult(bet?.result);

        return [
            "WON",
            "LOST",
            "PUSH"
        ].includes(result);
    });
}

export function createBet(bet) {
    if (!bet || typeof bet !== "object") {
        throw new TypeError(
            "Le pari à enregistrer doit être un objet."
        );
    }

    return saveBet(bet);
}

export function settleBet(
    betId,
    result,
    game
) {
    return updateBetSettlement(
        betId,
        result,
        game
    );
}

function normalizeResult(result) {
    return String(result || "")
        .trim()
        .toUpperCase();
}
