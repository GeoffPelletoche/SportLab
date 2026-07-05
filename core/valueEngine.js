import { addBet } from "./betsStore.js";

/**
 * 🧠 VALUE ENGINE CLEAN V2
 */

export function calculateValueBet(match, sport = "football") {

  const odds = Number(match.odds || 2);

  const impliedProb = 1 / odds;
  const modelProb = getModelProbability(match, sport);

  const value = modelProb - impliedProb;
  const edge = value * odds;

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

  // 💰 ONLY VALUE BETS ARE STORED
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
 * 🧠 MODEL (simplifié stable)
 */
function getModelProbability(match, sport) {

  if (sport === "football") {
    return clamp(0.30);
  }

  if (sport === "rugby") {
    return clamp(0.55);
  }

  return 0.5;
}

function getThreshold(sport) {
  return sport === "football" ? 0.05 : 0.04;
}

function clamp(v) {
  return Math.max(0.01, Math.min(0.99, v));
}

function round(v) {
  return Math.round(v * 1000) / 1000;
}