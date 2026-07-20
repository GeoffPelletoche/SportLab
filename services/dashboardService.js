// services/dashboardService.js

import {
    getAllBets,
    getPlacedBets,
    getPendingBets,
    getSettledBets
} from "./betService.js";

import {
    getPortfolioSummary
} from "./portfolioService.js";

export function getDashboardData() {
    const bets = getAllBets();

    const placedBets = bets.filter(
        bet => bet.placed === true
    );

    const pendingBets = placedBets.filter(
        bet => bet.result === "PENDING"
    );

    const settledBets = placedBets.filter(
        bet =>
            bet.result === "WON" ||
            bet.result === "LOST" ||
            bet.result === "PUSH"
    );

    return {
        bets,
        placedBets,
        pendingBets,
        settledBets,

        portfolio: getPortfolioSummary(),

        counters: {
            total: bets.length,
            placed: placedBets.length,
            pending: pendingBets.length,
            settled: settledBets.length
        }
    };
}
