/**
 * 🧠 SPORTLAB V1.3 ADVANCED VALUE ENGINE
 * - Football (DrawHunter)
 * - Rugby (FrenchFlair)
 * - EV / Edge calculation
 * - ROI ready output
 */

import { addBet } from "./roiEngine.js";

/**
 * MAIN ENTRY
 */
export function calculateValueBet(match, sport = "football") {

  const odds = Number(match.odds || 2);

  // 📊 implied probability (bookmaker)
  const impliedProb = 1 / odds;

  // 🧠 model probability (advanced logic)
  const modelProb = getModelProbability(match, sport);

  // 💰 VALUE (expected value)
  const value = modelProb - impliedProb;

  // 📈 EDGE (risk-adjusted value)
  const edge = value * odds;

  // 🎯 DECISION RULE
  const decision = value > getThreshold(sport)
    ? "VALUE BET"
    : "NO BET";

  const result = {
    ...match,

    sport,
    impliedProb: round(impliedProb),
    modelProb: round(modelProb),
    value: round(value),
    edge: round(edge),
    decision,
    strategy: sport === "football" ? "DRAWHUNTER" : "FRENCHFLAIR"
  };

  /**
   * 💰 AUTO ROI INJECTION (ONLY VALUE BETS)
   */
  if (decision === "VALUE BET") {
    addBet({
      source: result.strategy,
      sport,
      match: `${match.home} vs ${match.away}`,
      odds,
      stake: 0.5, // safe fixed stake (V1.4 safe mode)
      decision
    });
  }

  return result;
}

/**
 * 🧠 ADVANCED PROBABILITY MODEL
 */
function getModelProbability(match, sport) {

  // ⚽ FOOTBALL (DRAW HUNTER MODEL)
  if (sport === "football") {

    const baseDraw = 0.28;

    const balanceFactor = 0.08; // équilibre équipes
    const leagueFactor = getLeagueFactor(match.league);

    return clamp(baseDraw + balanceFactor + leagueFactor);
  }

  // 🏉 RUGBY (FRENCH FLAIR MODEL)
  if (sport === "rugby") {

    const baseHomeWin = 0.52;

    const intensityFactor = 0.06;
    const competitionFactor = 0.04;

    return clamp(baseHomeWin + intensityFactor + competitionFactor);
  }

  return 0.5;
}

/**
 * 📊 THRESHOLDS (RISK FILTER)
 */
function getThreshold(sport) {

  if (sport === "football") {
    return 0.05; // stricter draw market
  }

  if (sport === "rugby") {
    return 0.04;
  }

  return 0.05;
}

/**
 * 🧩 LEAGUE ADJUSTMENT (FOOTBALL ONLY)
 */
function getLeagueFactor(league) {

  if (!league) return 0;

  const strongDefensiveLeagues = [
    "Serie A",
    "Ligue 1"
  ];

  if (strongDefensiveLeagues.includes(league)) {
    return 0.03;
  }

  return 0.01;
}

/**
 * 🛠️ UTILS
 */
function clamp(v) {
  return Math.max(0.01, Math.min(0.99, v));
}

function round(v) {
  return Math.round(v * 1000) / 1000;
}
