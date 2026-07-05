/**
 * 🧠 SPORTLAB VALUE ENGINE V2.3 FIXED
 * - stable
 * - compatible modules
 * - safe execution
 */

export function computeValueEngine(match) {
  const {
    odds,
    modelProb,
    impliedProb,
    sport,
    league
  } = match;

  if (!odds || !modelProb) {
    return formatResult(match, 0, 0, "NO BET");
  }

  const value = (modelProb || 0) - (impliedProb || 0);
  const edge = (modelProb * odds) - 1;

  const decision = decide(value, edge, sport, league);

  return formatResult(match, value, edge, decision);
}

/**
 * 🎯 DECISION ENGINE SAFE
 */
function decide(value, edge, sport) {

  if (value >= 0.02 && edge >= 0.02) {
    return "VALUE BET";
  }

  if (value >= 0.01 && edge >= 0.015) {
    return "VALUE BET";
  }

  if (sport === "rugby" && value >= 0.008) {
    return "VALUE BET";
  }

  return "NO BET";
}

/**
 * 📦 FORMAT SAFE OUTPUT
 */
function formatResult(match, value, edge, decision) {
  return {
    ...match,
    value: Number(value.toFixed(4)),
    edge: Number(edge.toFixed(4)),
    decision,
    strategy: match.strategy || "SPORTLAB_V2_3"
  };
}

/**
 * 🔁 COMPATIBILITY WRAPPER (IMPORTANT FIX)
 * utilisé par drawhunter + frenchflair
 */
export function calculateValueBet(match, sport = "football") {
  return computeValueEngine({
    ...match,
    sport
  });
}