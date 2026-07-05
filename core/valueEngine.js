import { addBet } from "./roiEngine.js";

/**
 * 🧠 SPORTLAB VALUE ENGINE V1.3 + SYNC HOOK
 */

export function calculateValueBet(match, sport = "football") {

  const odds = Number(match.odds || 2);

  // 📊 implied probability (bookmaker)
  const impliedProb = 1 / odds;

  // 🧠 model probability (AI logic)
  const modelProb = getModelProbability(match, sport);

  // 💰 VALUE (EV)
  const value = modelProb - impliedProb;

  // 📈 EDGE
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

  /**
   * 💾 SYNC HOOK (ROI ENGINE + KV READY)
   */
  if (decision === "VALUE BET") {

    addBet({
      source: enriched.strategy,
      sport,
      match: `${match.home} vs ${match.away}`,
      odds,
      stake: 0.5, // safe default (V1 stable mode)
      decision
    });
  }

  return enriched;
}

/**
 * 🧠 FOOTBALL / DRAW MODEL
 */
function getModelProbability(match, sport) {

  if (sport === "football") {

    const baseDraw = 0.28;

    const balanceFactor = 0.08;

    const leagueFactor =
      match.league === "Serie A" || match.league === "Ligue 1"
        ? 0.03
        : 0.01;

    return clamp(baseDraw + balanceFactor + leagueFactor);
  }

  if (sport === "rugby") {

    const baseWin = 0.52;
    const intensity = 0.06;
    const competition = 0.04;

    return clamp(baseWin + intensity + competition);
  }

  return 0.5;
}

/**
 * 🎯 THRESHOLD LOGIC
 */
function getThreshold(sport) {

  if (sport === "football") return 0.05;
  if (sport === "rugby") return 0.04;

  return 0.05;
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