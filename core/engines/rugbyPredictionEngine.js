/**
 * SPORTLAB V3 — RUGBY PREDICTION ENGINE
 * Sprint 4A.6
 *
 * Ajout :
 * - Indice de confiance SportLab
 */

export function computeTeamStats(history = []) {
  const games = sanitizeGames(history);

  if (games.length === 0) return emptyStats();

  const homeGames = games.filter(game => game.isHome);
  const awayGames = games.filter(game => !game.isHome);

  return {
    games: games.length,

    averageFor: round(avg(games.map(g => g.pointsFor))),
    averageAgainst: round(avg(games.map(g => g.pointsAgainst))),

    homeGames: homeGames.length,
    homeAverageFor: round(avg(homeGames.map(g => g.pointsFor))),
    homeAverageAgainst: round(avg(homeGames.map(g => g.pointsAgainst))),

    awayGames: awayGames.length,
    awayAverageFor: round(avg(awayGames.map(g => g.pointsFor))),
    awayAverageAgainst: round(avg(awayGames.map(g => g.pointsAgainst))),

    attackSigma: round(stdDev(games.map(g => g.pointsFor))),
    defenseSigma: round(stdDev(games.map(g => g.pointsAgainst))),

    totalAverage: round(avg(games.map(g => g.pointsFor + g.pointsAgainst))),
    totalSigma: round(stdDev(games.map(g => g.pointsFor + g.pointsAgainst)))
  };
}

export function predictRugbyMatch(match) {
  const homeStats = computeTeamStats(match.homeHistory || []);
  const awayStats = computeTeamStats(match.awayHistory || []);

  const predictionStatus =
    homeStats.games > 0 && awayStats.games > 0
      ? "OK"
      : "INSUFFICIENT_HISTORY";

  const baselinePoints = computeBaselinePoints(homeStats, awayStats);

  const homeAttack = chooseHomeAttack(homeStats);
  const homeDefense = chooseHomeDefense(homeStats);

  const awayAttack = chooseAwayAttack(awayStats);
  const awayDefense = chooseAwayDefense(awayStats);

  const homeAttackIndex = safeRatio(homeAttack, baselinePoints);
  const awayAttackIndex = safeRatio(awayAttack, baselinePoints);

  const homeDefenseWeaknessIndex = safeRatio(homeDefense, baselinePoints);
  const awayDefenseWeaknessIndex = safeRatio(awayDefense, baselinePoints);

  const modelHomePoints =
    baselinePoints * homeAttackIndex * awayDefenseWeaknessIndex;

  const modelAwayPoints =
    baselinePoints * awayAttackIndex * homeDefenseWeaknessIndex;

  const simpleHomePoints = (homeAttack + awayDefense) / 2;
  const simpleAwayPoints = (awayAttack + homeDefense) / 2;

  const predictedHomePoints = round(blend(modelHomePoints, simpleHomePoints));
  const predictedAwayPoints = round(blend(modelAwayPoints, simpleAwayPoints));
  const predictedTotalPoints = round(predictedHomePoints + predictedAwayPoints);
const historicalReferenceTotal = round(
  avg(
    [
      homeStats.totalAverage,
      awayStats.totalAverage
    ].filter(value => value > 0)
  )
);

const recommendedTrend =
  predictedTotalPoints >= historicalReferenceTotal
    ? "OVER"
    : "UNDER";

  const sigma = round(avg([
    homeStats.totalSigma,
    awayStats.totalSigma
  ].filter(v => v > 0)));

  const confidence = computeConfidence({
    homeStats,
    awayStats,
    sigma,
    predictedTotalPoints,
    predictionStatus
  });

  return {
    ...match,

    homeStats,
    awayStats,

    baselinePoints: round(baselinePoints),

    homeAttackIndex: round(homeAttackIndex),
    awayAttackIndex: round(awayAttackIndex),
    homeDefenseWeaknessIndex: round(homeDefenseWeaknessIndex),
    awayDefenseWeaknessIndex: round(awayDefenseWeaknessIndex),

    predictedHomePoints,
    predictedAwayPoints,
    predictedTotalPoints,
    
    historicalReferenceTotal,
    recommendedTrend,
    
    sigma,
    predictedRangeLow: round(predictedTotalPoints - sigma),
    predictedRangeHigh: round(predictedTotalPoints + sigma),

    confidence,

    predictionStatus
  };
}

function computeConfidence({ homeStats, awayStats, sigma, predictedTotalPoints, predictionStatus }) {
  if (predictionStatus !== "OK") return 0;

  const totalGames = homeStats.games + awayStats.games;

  const sampleScore = clamp(totalGames / 20, 0, 1) * 25;

  const sigmaRatio = predictedTotalPoints > 0
    ? sigma / predictedTotalPoints
    : 1;

  const stabilityScore = clamp(1 - sigmaRatio, 0, 1) * 40;

  const homeBalance = homeStats.homeGames > 0 ? 1 : 0.65;
  const awayBalance = awayStats.awayGames > 0 ? 1 : 0.65;
  const contextScore = ((homeBalance + awayBalance) / 2) * 20;

  const attackStability = avg([
    normalizeStability(homeStats.attackSigma),
    normalizeStability(awayStats.attackSigma)
  ]);

  const defenseStability = avg([
    normalizeStability(homeStats.defenseSigma),
    normalizeStability(awayStats.defenseSigma)
  ]);

  const consistencyScore = avg([attackStability, defenseStability]) * 15;

  return Math.round(
    clamp(
      sampleScore + stabilityScore + contextScore + consistencyScore,
      35,
      92
    )
  );
}

function normalizeStability(sigma) {
  if (!sigma || sigma <= 0) return 0.5;
  return clamp(1 - sigma / 20, 0, 1);
}

function computeBaselinePoints(homeStats, awayStats) {
  const values = [
    homeStats.averageFor,
    homeStats.averageAgainst,
    awayStats.averageFor,
    awayStats.averageAgainst
  ].filter(v => v > 0);

  return values.length ? avg(values) : 25;
}

function chooseHomeAttack(stats) {
  return stats.homeGames > 0 ? stats.homeAverageFor : stats.averageFor;
}

function chooseHomeDefense(stats) {
  return stats.homeGames > 0 ? stats.homeAverageAgainst : stats.averageAgainst;
}

function chooseAwayAttack(stats) {
  return stats.awayGames > 0 ? stats.awayAverageFor : stats.averageFor;
}

function chooseAwayDefense(stats) {
  return stats.awayGames > 0 ? stats.awayAverageAgainst : stats.averageAgainst;
}

function blend(adjusted, simple) {
  return adjusted * 0.65 + simple * 0.35;
}

function safeRatio(value, baseline) {
  if (!baseline || baseline <= 0) return 1;
  if (!value || value <= 0) return 1;

  return clamp(value / baseline, 0.65, 1.45);
}

function sanitizeGames(history) {
  return history.filter(game =>
    game &&
    game.status === "FT" &&
    Number.isFinite(Number(game.pointsFor)) &&
    Number.isFinite(Number(game.pointsAgainst))
  ).map(game => ({
    ...game,
    pointsFor: Number(game.pointsFor),
    pointsAgainst: Number(game.pointsAgainst),
    isHome: Boolean(game.isHome)
  }));
}

function emptyStats() {
  return {
    games: 0,

    averageFor: 0,
    averageAgainst: 0,

    homeGames: 0,
    homeAverageFor: 0,
    homeAverageAgainst: 0,

    awayGames: 0,
    awayAverageFor: 0,
    awayAverageAgainst: 0,

    attackSigma: 0,
    defenseSigma: 0,

    totalAverage: 0,
    totalSigma: 0
  };
}

function avg(values) {
  const clean = values.filter(v => Number.isFinite(Number(v)));
  if (clean.length === 0) return 0;

  return clean.reduce((sum, value) => sum + Number(value), 0) / clean.length;
}

function stdDev(values) {
  const clean = values.map(Number).filter(v => Number.isFinite(v));
  if (clean.length < 2) return 0;

  const mean = avg(clean);
  const variance =
    clean.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / clean.length;

  return Math.sqrt(variance);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function round(value) {
  return Math.round(value * 10) / 10;
}
