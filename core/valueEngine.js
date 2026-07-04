export function calculateValueBet(match, sport = "football") {

  const odds = Number(match.odds || 2);

  // 🧠 PROBABILITÉ IMPLICITE BOOKMAKER
  const impliedProb = 1 / odds;

  // 🧬 PROBABILITÉ MODÈLE (ADVANCED SIMPLIFIÉ)
  const modelProb = getModelProbability(match, sport);

  // 📊 VALUE
  const value = modelProb - impliedProb;

  // 📈 EDGE (ajustement risque)
  const edge = value * odds;

  return {
    ...match,
    impliedProb: round(impliedProb),
    modelProb: round(modelProb),
    value: round(value),
    edge: round(edge),
    decision: value > 0.05 ? "VALUE BET" : "NO BET"
  };
}

/**
 * 🧠 MODÈLE FOOTBALL / DRAWHUNTER
 */
function getModelProbability(match, sport) {

  if (sport === "football") {

    // logique draw (low scoring + équilibre)
    const baseDraw = 0.28;

    const balanceFactor = 0.1; // teams balance
    const volatility = 0.05;

    return clamp(baseDraw + balanceFactor - volatility);

  }

  if (sport === "rugby") {

    // FrenchFlair model (plus de variance + scoring élevé)
    const baseWin = 0.55;

    const intensityFactor = 0.1;

    return clamp(baseWin + intensityFactor);
  }

  return 0.5;
}

/**
 * UTILITIES
 */
function clamp(v) {
  return Math.max(0.01, Math.min(0.99, v));
}

function round(v) {
  return Math.round(v * 1000) / 1000;
}
