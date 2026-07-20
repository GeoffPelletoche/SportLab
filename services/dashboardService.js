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
    const placedBets = getPlacedBets();
    const pendingBets = getPendingBets();
    const settledBets = getSettledBets();
    const portfolio = getPortfolioSummary();

    return {
        bets,
        placedBets,
        pendingBets,
        settledBets,
        portfolio,

        counters: {
            total: bets.length,
            placed: placedBets.length,
            pending: pendingBets.length,
            settled: settledBets.length
        }
    };
}
