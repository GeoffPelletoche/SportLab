import { getBets } from "./betsStore.js";

export async function settlePendingBets() {
    const bets = getBets();

    if (!Array.isArray(bets) || bets.length === 0) {
        return [];
    }

    const pendingBets = bets.filter(
        bet =>
            bet.placed === true &&
            bet.result === "PENDING"
    );

    if (pendingBets.length === 0) {
        return [];
    }

    const now = Date.now();

    return pendingBets.filter(bet => {
        if (!bet.matchDate) return false;

        const matchTime = new Date(bet.matchDate).getTime();

        return Number.isFinite(matchTime) && matchTime <= now;
    });
}