/**
 * SPORTLAB V3 — VALUE ENGINE
 * Rôle unique :
 * comparer une probabilité modèle à la probabilité implicite d'une cote.
 */

export function computeValue({ probability, odds, minValue = 0.01 }) {
  const p = Number(probability);
  const o = Number(odds);

  if (!p || !o || o <= 1) {
    return {
      probability: 0,
      impliedProbability: 0,
      value: 0,
      edge: 0,
      decision: "NO BET",
      reason: "Données insuffisantes"
    };
  }

  const impliedProbability = 1 / o;
  const value = p - impliedProbability;
  const edge = (p * o) - 1;

  const decision = value >= minValue && edge > 0
    ? "VALUE BET"
    : "NO BET";

  return {
    probability: round(p),
    impliedProbability: round(impliedProbability),
    value: round(value),
    edge: round(edge),
    decision,
    reason: buildReason(value, edge, decision)
  };
}

function buildReason(value, edge, decision) {
  if (decision === "VALUE BET") {
    return "La probabilité modèle est supérieure à la probabilité implicite de la cote.";
  }

  return "La value calculée n'est pas suffisante.";
}

function round(value) {
  return Math.round(value * 10000) / 10000;
}
