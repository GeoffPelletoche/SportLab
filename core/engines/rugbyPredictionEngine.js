import {
  effectiveSampleSize,
  prepareWeightedHistory,
  weightedMean,
  weightedStdDev
} from "./temporalWeightingEngine.js";

/** SPORTLAB V8 — RUGBY PREDICTION ENGINE */
export function computeTeamStats(history = []) {
  const games = sanitizeGames(history);
  if (!games.length) return emptyStats();
  const homeGames = games.filter(game => game.isHome);
  const awayGames = games.filter(game => !game.isHome);
  const statsFor = subset => {
    const weights = subset.map(g => g.temporalWeight);
    return {
      averageFor: round(weightedMean(subset.map(g => g.pointsFor), weights)),
      averageAgainst: round(weightedMean(subset.map(g => g.pointsAgainst), weights))
    };
  };
  const all = statsFor(games), home = statsFor(homeGames), away = statsFor(awayGames);
  const weights = games.map(g => g.temporalWeight);
  return {
    games: games.length,
    effectiveGames: round(effectiveSampleSize(games)),
    oldestMatchDate: games.at(-1)?.date || null,
    newestMatchDate: games[0]?.date || null,
    averageFor: all.averageFor,
    averageAgainst: all.averageAgainst,
    homeGames: homeGames.length,
    homeAverageFor: home.averageFor,
    homeAverageAgainst: home.averageAgainst,
    awayGames: awayGames.length,
    awayAverageFor: away.averageFor,
    awayAverageAgainst: away.averageAgainst,
    attackSigma: round(weightedStdDev(games.map(g => g.pointsFor), weights)),
    defenseSigma: round(weightedStdDev(games.map(g => g.pointsAgainst), weights)),
    totalAverage: round(weightedMean(games.map(g => g.pointsFor + g.pointsAgainst), weights)),
    totalSigma: round(weightedStdDev(games.map(g => g.pointsFor + g.pointsAgainst), weights))
  };
}

export function predictRugbyMatch(match) {
  const homeStats = computeTeamStats(match.homeHistory || []);
  const awayStats = computeTeamStats(match.awayHistory || []);
  const predictionStatus = homeStats.games >= 3 && awayStats.games >= 3 ? "OK" : "INSUFFICIENT_HISTORY";
  const baselinePoints = computeBaselinePoints(homeStats, awayStats);
  const homeAttack = homeStats.homeGames >= 3 ? homeStats.homeAverageFor : homeStats.averageFor;
  const homeDefense = homeStats.homeGames >= 3 ? homeStats.homeAverageAgainst : homeStats.averageAgainst;
  const awayAttack = awayStats.awayGames >= 3 ? awayStats.awayAverageFor : awayStats.averageFor;
  const awayDefense = awayStats.awayGames >= 3 ? awayStats.awayAverageAgainst : awayStats.averageAgainst;
  const homeAttackIndex = safeRatio(homeAttack, baselinePoints);
  const awayAttackIndex = safeRatio(awayAttack, baselinePoints);
  const homeDefenseWeaknessIndex = safeRatio(homeDefense, baselinePoints);
  const awayDefenseWeaknessIndex = safeRatio(awayDefense, baselinePoints);
  const modelHome = baselinePoints * homeAttackIndex * awayDefenseWeaknessIndex;
  const modelAway = baselinePoints * awayAttackIndex * homeDefenseWeaknessIndex;
  const predictedHomePoints = round(modelHome * 0.65 + ((homeAttack + awayDefense) / 2) * 0.35);
  const predictedAwayPoints = round(modelAway * 0.65 + ((awayAttack + homeDefense) / 2) * 0.35);
  const predictedTotalPoints = round(predictedHomePoints + predictedAwayPoints);
  const historicalReferenceTotal = round(avg([homeStats.totalAverage, awayStats.totalAverage].filter(v => v > 0)));
  const recommendedTrend = predictedTotalPoints >= historicalReferenceTotal ? "OVER" : "UNDER";
  const sigma = round(avg([homeStats.totalSigma, awayStats.totalSigma].filter(v => v > 0)));
  const confidence = computeConfidence(homeStats, awayStats, sigma, predictedTotalPoints, predictionStatus);
  return { ...match, homeStats, awayStats, baselinePoints: round(baselinePoints), homeAttackIndex: round(homeAttackIndex), awayAttackIndex: round(awayAttackIndex), homeDefenseWeaknessIndex: round(homeDefenseWeaknessIndex), awayDefenseWeaknessIndex: round(awayDefenseWeaknessIndex), predictedHomePoints, predictedAwayPoints, predictedTotalPoints, historicalReferenceTotal, recommendedTrend, sigma, predictedRangeLow: round(predictedTotalPoints - sigma), predictedRangeHigh: round(predictedTotalPoints + sigma), confidence, predictionStatus, weightingModel: "RECENCY_EXPONENTIAL_V8", historyTarget: 30 };
}
function computeConfidence(home, away, sigma, total, status) {
  if (status !== "OK") return 0;
  const effective = home.effectiveGames + away.effectiveGames;
  const sample = clamp(effective / 35, 0, 1) * 30;
  const stability = clamp(1 - (total > 0 ? sigma / total : 1), 0, 1) * 40;
  const context = ((home.homeGames >= 3 ? 1 : .65) + (away.awayGames >= 3 ? 1 : .65)) / 2 * 20;
  const recency = Math.min(home.games, away.games) >= 10 ? 10 : Math.min(home.games, away.games);
  return Math.round(clamp(sample + stability + context + recency, 35, 94));
}
function sanitizeGames(history) {
  return prepareWeightedHistory(history, { maxMatches: 30, decay: 0.97, minimumWeight: 0.4 })
    .filter(game => ["FT","AET","AP","FINISHED","MATCH FINISHED"].includes(String(game.status || "").toUpperCase()) && Number.isFinite(Number(game.pointsFor)) && Number.isFinite(Number(game.pointsAgainst)))
    .map(game => ({ ...game, pointsFor: Number(game.pointsFor), pointsAgainst: Number(game.pointsAgainst), isHome: Boolean(game.isHome) }));
}
function emptyStats(){return {games:0,effectiveGames:0,oldestMatchDate:null,newestMatchDate:null,averageFor:0,averageAgainst:0,homeGames:0,homeAverageFor:0,homeAverageAgainst:0,awayGames:0,awayAverageFor:0,awayAverageAgainst:0,attackSigma:0,defenseSigma:0,totalAverage:0,totalSigma:0};}
function computeBaselinePoints(h,a){const v=[h.averageFor,h.averageAgainst,a.averageFor,a.averageAgainst].filter(x=>x>0);return v.length?avg(v):25;}
function safeRatio(v,b){return !b||b<=0||!v||v<=0?1:clamp(v/b,.65,1.45);}
function avg(v){return v.length?v.reduce((a,b)=>a+Number(b),0)/v.length:0;}
function clamp(v,min,max){return Math.max(min,Math.min(max,v));}
function round(v){return Math.round((Number(v)||0)*10)/10;}
