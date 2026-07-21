import { getBets } from "../stores/betsStore.js";

/**
 * SPORTLAB V6.2 — ROI ENGINE
 *
 * Source unique de calcul des performances financières.
 *
 * Résultats reconnus :
 * - WON
 * - LOST
 * - PUSH
 * - PENDING
 */

function toNumber(value) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
}

function normalizeResult(value) {
  const result = String(value ?? "")
    .trim()
    .toUpperCase();

  /*
   * Compatibilité avec d’anciennes données éventuelles.
   */
  if (result === "WIN") {
    return "WON";
  }

  if (result === "LOSS") {
    return "LOST";
  }

  return result || "PENDING";
}

function round(value) {
  return Math.round(
    (toNumber(value) + Number.EPSILON) * 100
  ) / 100;
}

/**
 * Calcule le ROI pour une liste de paris.
 *
 * Les paris en attente ne sont pas inclus dans :
 * - la mise réglée ;
 * - le profit ;
 * - le ROI.
 */
export function calculateROI(bets = []) {
  const safeBets =
    Array.isArray(bets)
      ? bets
      : [];

  const placedBets = safeBets.filter(
    bet => bet?.placed === true
  );

  let settledStake = 0;
  let pendingStake = 0;
  let profit = 0;

  let wins = 0;
  let losses = 0;
  let pushes = 0;
  let pending = 0;

  placedBets.forEach(bet => {
    const stake = Math.max(
      toNumber(bet?.stake),
      0
    );

    const odds = Math.max(
      toNumber(bet?.odds),
      0
    );

    const result =
      normalizeResult(
        bet?.result || bet?.finalStatus
      );

    if (result === "WON") {
      settledStake += stake;
      profit += stake * (odds - 1);
      wins++;
      return;
    }

    if (result === "LOST") {
      settledStake += stake;
      profit -= stake;
      losses++;
      return;
    }

    if (result === "PUSH") {
      settledStake += stake;
      pushes++;
      return;
    }

    pendingStake += stake;
    pending++;
  });

  const settledBets =
    wins + losses + pushes;

  const decisiveBets =
    wins + losses;

  const roi =
    settledStake > 0
      ? (profit / settledStake) * 100
      : 0;

  const winRate =
    decisiveBets > 0
      ? (wins / decisiveBets) * 100
      : 0;

  return {
    totalBets:
      safeBets.length,

    placedBets:
      placedBets.length,

    nonPlacedBets:
      safeBets.filter(
        bet => bet?.placed !== true
      ).length,

    settledBets,

    wins,
    losses,
    pushes,
    pending,

    settledStake:
      round(settledStake),

    /*
     * Conservé pour compatibilité avec portfolioService.
     */
    invested:
      round(settledStake),

    pendingStake:
      round(pendingStake),

    totalCommitted:
      round(
        settledStake + pendingStake
      ),

    profit:
      round(profit),

    roi:
      round(roi),

    winRate:
      round(winRate)
  };
}

export function getROI() {
  return calculateROI(
    getBets()
  );
}

export function getROIBySource(source) {
  const normalizedSource =
    String(source ?? "")
      .trim()
      .toUpperCase();

  const bets = getBets().filter(
    bet =>
      String(bet?.source ?? "")
        .trim()
        .toUpperCase() === normalizedSource
  );

  return calculateROI(bets);
}