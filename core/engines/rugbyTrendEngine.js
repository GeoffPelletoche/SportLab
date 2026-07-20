/**
 * SPORTLAB V3 — RUGBY TREND ENGINE
 * Rôle unique :
 * proposer une tendance OVER / UNDER avec indice de confiance.
 */

export function computeRugbyTrend(match) {
  const homeAvgFor = Number(match.homeAvgFor || 24);
  const homeAvgAgainst = Number(match.homeAvgAgainst || 22);
  const awayAvgFor = Number(match.awayAvgFor || 23);
  const awayAvgAgainst = Number(match.awayAvgAgainst || 23);

  const expectedHomePoints = (homeAvgFor + awayAvgAgainst) / 2;
  const expectedAwayPoints = (awayAvgFor + homeAvgAgainst) / 2;
  const expectedTotalPoints = expectedHomePoints + expectedAwayPoints;

  const trend = expectedTotalPoints >= 48 ? "OVER" : "UNDER";

  const distanceFromNeutral = Math.abs(expectedTotalPoints - 48);
  const confidence = Math.min(75, 52 + distanceFromNeutral * 2);

  return {
    ...match,
    expectedHomePoints: round(expectedHomePoints),
    expectedAwayPoints: round(expectedAwayPoints),
    expectedTotalPoints: round(expectedTotalPoints),
    trend,
    confidence: round(confidence)
  };
}

function round(value) {
  return Math.round(value * 100) / 100;
}
