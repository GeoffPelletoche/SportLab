import { getBets } from "./betsStore.js";
import { getROI } from "./roiEngine.js";

/**
 * 📊 SPORTLAB ROI ANALYTICS V2 CLEAN
 * - stable data aggregation
 * - no engine dependency
 */

export function getAnalytics() {

  const bets = getBets();
  const roi = getROI();

  // ⚽ / 🏉 split
  const sportSplit = {
    football: bets.filter(b => b.sport === "football").length,
    rugby: bets.filter(b => b.sport === "rugby").length
  };

  // 🎯 decision split
  const decisionSplit = {
    value: bets.filter(b => b.decision === "VALUE BET").length,
    noBet: bets.filter(b => b.decision === "NO BET").length
  };

  // 📈 win/loss split
  const resultSplit = {
    win: bets.filter(b => b.result === "WIN").length,
    loss: bets.filter(b => b.result === "LOSS").length,
    pending: bets.filter(b => b.result === "PENDING").length
  };

  return {
    roi,
    sportSplit,
    decisionSplit,
    resultSplit,
    totalBets: bets.length
  };
}