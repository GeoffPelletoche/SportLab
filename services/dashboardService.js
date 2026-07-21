// services/dashboardService.js

import { getAllBets } from "./betService.js";
import { getPortfolioSummary } from "./portfolioService.js";

function normalizeResult(result) {
  return String(result || "")
    .trim()
    .toUpperCase();
}

export function getDashboardData() {
  const bets = getAllBets();

  const placedBets = bets.filter(
    bet => bet?.placed === true
  );

  const pendingBets = placedBets.filter(
    bet => normalizeResult(bet.result) === "PENDING"
  );

  const settledBets = placedBets.filter(bet => {
    const result = normalizeResult(bet.result);

    return [
      "WON",
      "LOST",
      "PUSH"
    ].includes(result);
  });

  return {
    bets,

    portfolio: getPortfolioSummary(),

    counters: {
      total: bets.length,
      placed: placedBets.length,
      pending: pendingBets.length,
      settled: settledBets.length
    }
  };
}