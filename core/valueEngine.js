import { addBet } from "./betsStore.js";

/**
 * 🧠 SPORTLAB VALUE ENGINE V2 CLEAN
 * - stable architecture
 * - no circular dependency
 * - ROI safe injection
 */

export function calculateValueBet(match, sport = "football") {

  const odds = Number(match.odds || 2);

  // 📊 implied probability (bookmaker)
  const impliedProb = 1 / odds;

  // 🧠 model probability (simple stable model V2)
  const modelProb = getModelProbability(match, sport);

  // 💰 VALUE (EV)
  const value = modelProb - impliedProb;

  // 📈 EDGE
  const edge = value * odds;

  // 🎯 DECISION RULE
  const decision = value > getThreshold(sport)
    ? "VALUE BET"
    : "NO BET";

  const enriched = {
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
   * 💾 SAFE BET STORAGE (NO ENGINE DEPENDENCY)
   */
  if (decision === "VALUE BET") {

    addBet({
      source: enriched.strategy,
      sport,
      match: `${match.home} vs ${match.away}`,
      odds,
      stake: 0.5,
      decision
    });
  }

  return enriched;
}

/**
 * 🧠 SIMPLE STABLE MODEL (V2)
 */
function getModelProbability(match, sport) {

  if (sport === "football") {
    // draw baseline model
    return clamp(0.30);
  }

  if (sport === "rugby") {
    // home win baseline model
    return clamp(0.55);
  }

  return 0.5;
}

/**
 * 🎯 THRESHOLD SYSTEM
 */
function getThreshold(sport) {
  return sport === "football" ? 0.05 : 0.04;
}

/**
 * 🛠️ HELPERS
 */
function clamp(v) {
  return Math.max(0.01, Math.min(0.99, v));
}

function round(v) {
  return Math.round(v * 1000) / 1000;
}