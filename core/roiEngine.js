import { getBets } from "./betsStore.js";

/**
 * SPORTLAB V3 — ROI ENGINE
 * Rôle unique :
 * calculer les statistiques du portefeuille.
 */

export function getROI() {
  const bets = getBets();

  const placedBets = bets.filter(bet => bet.placed === true);

  let invested = 0;
  let profit = 0;
  let wins = 0;
  let losses = 0;
  let pending = 0;

  placedBets.forEach(bet => {
    invested += Number(bet.stake || 0);

    if (bet.result === "WIN") {
      profit += Number(bet.stake) * (Number(bet.odds) - 1);
      wins++;
    }

    if (bet.result === "LOSS") {
      profit -= Number(bet.stake);
      losses++;
    }

    if (bet.result === "PENDING") {
      pending++;
    }
  });

  const roi = invested > 0 ? (profit / invested) * 100 : 0;

  return {
    totalBets: bets.length,
    placedBets: placedBets.length,
    nonPlacedBets: bets.filter(bet => bet.placed === false).length,
    wins,
    losses,
    pending,
    invested: round(invested),
    profit: round(profit),
    roi: round(roi)
  };
}

export function getROIBySource(source) {
  const bets = getBets().filter(bet => bet.source === source);
  return calculateROI(bets);
}

function calculateROI(bets) {
  const placedBets = bets.filter(bet => bet.placed === true);

  let invested = 0;
  let profit = 0;
  let wins = 0;
  let losses = 0;
  let pending = 0;

  placedBets.forEach(bet => {
    invested += Number(bet.stake || 0);

    if (bet.result === "WIN") {
      profit += Number(bet.stake) * (Number(bet.odds) - 1);
      wins++;
    }

    if (bet.result === "LOSS") {
      profit -= Number(bet.stake);
      losses++;
    }

    if (bet.result === "PENDING") {
      pending++;
    }
  });

  const roi = invested > 0 ? (profit / invested) * 100 : 0;

  return {
    totalBets: bets.length,
    placedBets: placedBets.length,
    wins,
    losses,
    pending,
    invested: round(invested),
    profit: round(profit),
    roi: round(roi)
  };
}

function round(value) {
  return Math.round(value * 100) / 100;
}