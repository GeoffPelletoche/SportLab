/**
 * SPORTLAB V6.2 — STATISTICS SERVICE
 *
 * Calcule les statistiques à partir des paris enregistrés.
 * Les paris en attente sont exclus des calculs financiers.
 */

import {
  getAllBets
} from "./betService.js";

function toNumber(value) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
}

function normalizeText(value) {
  return String(value ?? "")
    .trim()
    .toUpperCase();
}

function normalizeResult(bet) {
  return normalizeText(
    bet?.result ||
    bet?.finalStatus ||
    "PENDING"
  );
}

function isPlacedBet(bet) {
  return bet?.placed === true;
}

function isSettledResult(result) {
  return [
    "WON",
    "LOST",
    "PUSH"
  ].includes(result);
}

function calculateBetProfit(bet) {
  const result = normalizeResult(bet);
  const stake = toNumber(bet?.stake);
  const odds = toNumber(bet?.odds);

  if (result === "WON") {
    return stake * odds - stake;
  }

  if (result === "LOST") {
    return -stake;
  }

  if (result === "PUSH") {
    return 0;
  }

  return 0;
}

function calculateRate(part, total) {
  if (total <= 0) {
    return 0;
  }

  return (part / total) * 100;
}

function calculateRoi(profit, stake) {
  if (stake <= 0) {
    return 0;
  }

  return (profit / stake) * 100;
}

function buildStatistics(bets) {
  const placedBets = bets.filter(isPlacedBet);

  const preparedBets = placedBets.map(bet => ({
    bet,
    result: normalizeResult(bet),
    stake: toNumber(bet?.stake),
    profit: calculateBetProfit(bet)
  }));

  const settledBets = preparedBets.filter(
    item => isSettledResult(item.result)
  );

  const pendingBets = preparedBets.filter(
    item => !isSettledResult(item.result)
  );

  const wonBets = settledBets.filter(
    item => item.result === "WON"
  );

  const lostBets = settledBets.filter(
    item => item.result === "LOST"
  );

  const pushBets = settledBets.filter(
    item => item.result === "PUSH"
  );

  const totalStake = settledBets.reduce(
    (sum, item) => sum + item.stake,
    0
  );

  const netProfit = settledBets.reduce(
    (sum, item) => sum + item.profit,
    0
  );

  /*
   * Le taux de réussite exclut les PUSH.
   * Il correspond donc à :
   *
   * gagnés / (gagnés + perdus)
   */
  const decisiveBetsCount =
    wonBets.length + lostBets.length;

  return {
    totalBets: bets.length,

    placedCount:
      placedBets.length,

    settledCount:
      settledBets.length,

    pendingCount:
      pendingBets.length,

    wonCount:
      wonBets.length,

    lostCount:
      lostBets.length,

    pushCount:
      pushBets.length,

    totalStake,

    netProfit,

    roi:
      calculateRoi(
        netProfit,
        totalStake
      ),

    winRate:
      calculateRate(
        wonBets.length,
        decisiveBetsCount
      )
  };
}

function groupBets(bets, getKey) {
  const groups = new Map();

  for (const bet of bets) {
    const rawKey = getKey(bet);

    const key =
      String(rawKey ?? "").trim() ||
      "Non renseigné";

    if (!groups.has(key)) {
      groups.set(key, []);
    }

    groups.get(key).push(bet);
  }

  return Array.from(
    groups.entries(),
    ([label, group]) => ({
      label,
      ...buildStatistics(group)
    })
  ).sort(
    (a, b) =>
      b.totalStake - a.totalStake
  );
}

export function getAdvancedStatistics() {
  const bets = getAllBets();

  return {
    global:
      buildStatistics(bets),

    bySport:
      groupBets(
        bets,
        bet => bet?.sport
      ),

    bySource:
      groupBets(
        bets,
        bet => bet?.source
      ),

    byCompetition:
      groupBets(
        bets,
        bet => bet?.competition
      ),

    byMarket:
      groupBets(
        bets,
        bet => bet?.market
      )
  };
}