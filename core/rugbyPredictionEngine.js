/**
 * SPORTLAB V3 — RUGBY PREDICTION ENGINE
 * Sprint 4A.4
 *
 * Rôle :
 * transformer les historiques rugby en prédiction simple :
 * - stats équipe domicile
 * - stats équipe extérieure
 * - points prédits domicile
 * - points prédits extérieur
 * - total prédit
 *
 * Aucun accès API.
 * Aucun HTML.
 * Aucun effet de bord.
 */

export function computeTeamStats(history = []) {
  const games = sanitizeGames(history);

  if (games.length === 0) {
    return emptyStats();
  }

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
    awayAverageAgainst: round(avg(awayGames.map(g => g.pointsAgainst)))
  };
}

export function predictRugbyMatch(match) {
  const homeStats = computeTeamStats(match.homeHistory || []);
  const awayStats = computeTeamStats(match.awayHistory || []);

  const homeAttack = homeStats.homeGames > 0
    ? homeStats.homeAverageFor
    : homeStats.averageFor;

  const homeDefense = homeStats.homeGames > 0
    ? homeStats.homeAverageAgainst
    : homeStats.averageAgainst;

  const awayAttack = awayStats.awayGames > 0
    ? awayStats.awayAverageFor
    : awayStats.averageFor;

  const awayDefense = awayStats.awayGames > 0
    ? awayStats.awayAverageAgainst
    : awayStats.averageAgainst;

  const predictedHomePoints = round((homeAttack + awayDefense) / 2);
  const predictedAwayPoints = round((awayAttack + homeDefense) / 2);
  const predictedTotalPoints = round(predictedHomePoints + predictedAwayPoints);

  return {
    ...match,

    homeStats,
    awayStats,

    predictedHomePoints,
    predictedAwayPoints,
    predictedTotalPoints,

    predictionStatus:
      homeStats.games > 0 && awayStats.games > 0
        ? "OK"
        : "INSUFFICIENT_HISTORY"
  };
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
    awayAverageAgainst: 0
  };
}

function avg(values) {
  const clean = values.filter(v => Number.isFinite(Number(v)));

  if (clean.length === 0) return 0;

  return clean.reduce((sum, value) => sum + Number(value), 0) / clean.length;
}

function round(value) {
  return Math.round(value * 10) / 10;
}