import { effectiveSampleSize, prepareWeightedHistory, weightedMean, weightedRate } from "./temporalWeightingEngine.js";

/** SPORTLAB V8 — DRAWHUNTER RECENCY MODEL */
export function computeFootballTeamStats(history = []) {
  const games = prepareWeightedHistory(history, { maxMatches: 30, decay: 0.97, minimumWeight: 0.4 })
    .filter(game => ["FT", "AET", "PEN"].includes(String(game.status || "").toUpperCase()))
    .filter(game => Number.isFinite(Number(game.goalsFor)) && Number.isFinite(Number(game.goalsAgainst)))
    .map(game => ({ ...game, goalsFor: Number(game.goalsFor), goalsAgainst: Number(game.goalsAgainst) }));
  if (!games.length) return emptyStats();
  const weights = games.map(game => game.temporalWeight);
  return {
    games: games.length,
    effectiveGames: round(effectiveSampleSize(games), 1),
    drawRate: weightedRate(games, game => game.goalsFor === game.goalsAgainst),
    lowScoringRate: weightedRate(games, game => game.goalsFor + game.goalsAgainst <= 2),
    bttsRate: weightedRate(games, game => game.goalsFor > 0 && game.goalsAgainst > 0),
    averageGoalsFor: weightedMean(games.map(game => game.goalsFor), weights),
    averageGoalsAgainst: weightedMean(games.map(game => game.goalsAgainst), weights),
    newestMatchDate: games[0]?.date || null,
    oldestMatchDate: games.at(-1)?.date || null
  };
}

export function predictDrawMatch(match) {
  const homeStats = computeFootballTeamStats(match.homeHistory || []);
  const awayStats = computeFootballTeamStats(match.awayHistory || []);
  const enoughHistory = homeStats.games >= 5 && awayStats.games >= 5;
  if (!enoughHistory) return { probability: 0.28, confidence: 0, predictionStatus: "INSUFFICIENT_HISTORY", homeStats, awayStats, weightingModel: "RECENCY_EXPONENTIAL_V8" };

  const drawProfile = (homeStats.drawRate + awayStats.drawRate) / 2;
  const lowScoringProfile = (homeStats.lowScoringRate + awayStats.lowScoringRate) / 2;
  const attackGap = Math.abs(homeStats.averageGoalsFor - awayStats.averageGoalsFor);
  const defenseGap = Math.abs(homeStats.averageGoalsAgainst - awayStats.averageGoalsAgainst);
  const balance = 1 - clamp((attackGap + defenseGap) / 4, 0, 1);
  const probability = clamp(0.12 + drawProfile * 0.48 + lowScoringProfile * 0.18 + balance * 0.12, 0.16, 0.48);
  const effective = homeStats.effectiveGames + awayStats.effectiveGames;
  const confidence = Math.round(clamp((effective / 45) * 65 + balance * 20 + Math.min(homeStats.games, awayStats.games) / 30 * 15, 35, 92));
  return { probability: round(probability, 4), confidence, predictionStatus: "OK", homeStats, awayStats, drawProfile: round(drawProfile, 4), lowScoringProfile: round(lowScoringProfile, 4), balance: round(balance, 4), weightingModel: "RECENCY_EXPONENTIAL_V8", historyTarget: 30 };
}
function emptyStats(){return {games:0,effectiveGames:0,drawRate:0,lowScoringRate:0,bttsRate:0,averageGoalsFor:0,averageGoalsAgainst:0,newestMatchDate:null,oldestMatchDate:null};}
function clamp(v,min,max){return Math.max(min,Math.min(max,v));}
function round(v,d=2){const f=10**d;return Math.round((Number(v)||0)*f)/f;}
