import { getBets } from "./betsStore.js";

/**
 * 💰 ROI ENGINE V2 CLEAN
 */

export function getROI() {

  const bets = getBets();

  let profit = 0;
  let invested = 0;
  let wins = 0;

  bets.forEach(b => {

    if (b.decision !== "VALUE BET") return;

    invested += b.stake;

    if (b.result === "WIN") {
      profit += b.stake * (b.odds - 1);
      wins++;
    }

    if (b.result === "LOSS") {
      profit -= b.stake;
    }
  });

  return {
    totalBets: bets.length,
    valueBets: bets.filter(b => b.decision === "VALUE BET").length,
    wins,
    profit: round(profit),
    roi: invested ? round((profit / invested) * 100) : 0
  };
}

function round(v) {
  return Math.round(v * 100) / 100;
}