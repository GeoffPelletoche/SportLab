/**
 * SPORTLAB V3 — RUGBY ANALYSIS ENGINE
 * Rôle unique :
 * analyser un match rugby et proposer une tendance OVER / UNDER.
 *
 * Important :
 * si les statistiques nécessaires sont absentes,
 * SportLab ne les invente pas.
 */

export function analyzeRugbyMatch(match) {
  const statsAvailable = hasRequiredStats(match);

  if (!statsAvailable) {
    return {
      ...match,
      trend: "UNAVAILABLE",
      confidence: 0,
      expectedTotalPoints: null,
      analysisStatus: "MISSING_STATS",
      explanation: "Statistiques historiques insuffisantes pour proposer une tendance fiable."
    };
  }

  const expectedHomePoints =
    (Number(match.homeAvgFor) + Number(match.awayAvgAgainst)) / 2;

  const expectedAwayPoints =
    (Number(match.awayAvgFor) + Number(match.homeAvgAgainst)) / 2;

  const expectedTotalPoints = expectedHomePoints + expectedAwayPoints;

  const trend = expectedTotalPoints >= 48 ? "OVER" : "UNDER";

  const distanceFromNeutral = Math.abs(expectedTotalPoints - 48);
  const confidence = Math.min(75, 52 + distanceFromNeutral * 2);

  return {
    ...match,
    trend,
    confidence: round(confidence),
    expectedHomePoints: round(expectedHomePoints),
    expectedAwayPoints: round(expectedAwayPoints),
    expectedTotalPoints: round(expectedTotalPoints),
    analysisStatus: "OK",
    explanation: buildExplanation(trend, expectedTotalPoints, confidence)
  };
}

function hasRequiredStats(match) {
  return [
    match.homeAvgFor,
    match.homeAvgAgainst,
    match.awayAvgFor,
    match.awayAvgAgainst
  ].every(value => value !== null && value !== undefined && !Number.isNaN(Number(value)));
}

function buildExplanation(trend, expectedTotalPoints, confidence) {
  return `Tendance ${trend} basée sur un total attendu de ${round(expectedTotalPoints)} points avec une confiance de ${round(confidence)}%.`;
}

function round(value) {
  return Math.round(value * 100) / 100;
}
