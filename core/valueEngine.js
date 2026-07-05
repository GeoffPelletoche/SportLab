/**
 * 🧠 SPORTLAB VALUE ENGINE V2.3
 * - stable
 * - réaliste
 * - compatible ROI + betsStore + settlement
 */

export function computeValueEngine(match) {

  const {
    odds,
    modelProb,
    impliedProb,
    sport,
    league
  } = match;

  // 🧠 sécurité
  if (!odds || !modelProb) {
    return formatResult(match, 0, 0, "NO BET");
  }

  /**
   * 📊 VALUE CALCULATION
   * value = edge probabilistic
   */
  const value = modelProb - impliedProb;

  /**
   * 📈 EDGE (profit expectation proxy)
   */
  const edge = (modelProb * odds) - 1;

  /**
   * 🧠 DECISION ENGINE (OPTIMISED BUT SAFE)
   */
  let decision = decide(value, edge, sport, league);

  return formatResult(match, value, edge, decision);
}

/**
 * 🎯 DECISION LOGIC (balanced version)
 */
function decide(value, edge, sport, league) {

  // 🟢 STRONG VALUE ZONE
  if (value >= 0.02 && edge >= 0.02) {
    return "VALUE BET";
  }

  // 🟡 MEDIUM VALUE ZONE (accept risk)
  if (value >= 0.01 && edge >= 0.015) {
    return "VALUE BET";
  }

  // 🟡 SPORT ADJUSTMENT (rugby / football tolerance)
  if (sport === "rugby" && value >= 0.008) {
    return "VALUE BET";
  }

  // ❌ default
  return "NO BET";
}

/**
 * 📦 FORMAT FINAL OUTPUT
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