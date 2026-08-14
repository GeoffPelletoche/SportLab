import { effectiveSampleSize, prepareWeightedHistory, weightedMean, weightedRate } from "./temporalWeightingEngine.js";

/** SPORTLAB V11.3.4 — DRAWHUNTER FAIR-ODDS RECALIBRATION */
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
  if (!enoughHistory) return { probability: 0.28, confidence: 0, predictionStatus: "INSUFFICIENT_HISTORY", homeStats, awayStats, weightingModel: "RECENCY_EXPONENTIAL_V11_3_4", probabilityModel: "DRAW_RATE_ANCHORED_V11_3_4", modelVersion: "DH-11.3.4" };

  const drawProfile = (homeStats.drawRate + awayStats.drawRate) / 2;
  const lowScoringProfile = (homeStats.lowScoringRate + awayStats.lowScoringRate) / 2;
  const attackGap = Math.abs(homeStats.averageGoalsFor - awayStats.averageGoalsFor);
  const defenseGap = Math.abs(homeStats.averageGoalsAgainst - awayStats.averageGoalsAgainst);
  const balance = 1 - clamp((attackGap + defenseGap) / 4, 0, 1);
  /*
   * V11.3.4 — Recalibration de la probabilité de nul.
   *
   * L'ancien modèle additionnait plusieurs facteurs positifs complets
   * (profil de nul + faible score + équilibre), ce qui pouvait transformer
   * un taux de nuls historique proche de 33 % en une probabilité finale
   * proche de 48 % — soit une cote juste autour de 2.10.
   *
   * Désormais :
   * 1. le taux de nuls pondéré constitue le socle de la probabilité ;
   * 2. ce taux est légèrement ramené vers un a-priori neutre lorsque
   *    l'échantillon effectif est encore limité ;
   * 3. faible score et équilibre ne sont que des ajustements secondaires,
   *    volontairement bornés.
   *
   * La cote juste reste strictement 1 / probabilité : aucun plancher de
   * cote artificiel n'est appliqué.
   */
  const effective = homeStats.effectiveGames + awayStats.effectiveGames;
  const sampleReliability = clamp((effective - 10) / 35, 0.25, 1);
  const priorDrawRate = 0.28;
  const calibratedDrawProfile = priorDrawRate + (drawProfile - priorDrawRate) * sampleReliability;
  const lowScoringAdjustment = clamp((lowScoringProfile - 0.50) * 0.08, -0.025, 0.025);
  const balanceAdjustment = clamp((balance - 0.65) * 0.03, -0.02, 0.02);
  const probability = clamp(
    calibratedDrawProfile + lowScoringAdjustment + balanceAdjustment,
    0.20,
    0.40
  );

  const confidence = Math.round(clamp((effective / 45) * 65 + balance * 20 + Math.min(homeStats.games, awayStats.games) / 30 * 15, 35, 92));
  return {
    probability: round(probability, 4),
    confidence,
    predictionStatus: "OK",
    homeStats,
    awayStats,
    drawProfile: round(drawProfile, 4),
    calibratedDrawProfile: round(calibratedDrawProfile, 4),
    lowScoringProfile: round(lowScoringProfile, 4),
    lowScoringAdjustment: round(lowScoringAdjustment, 4),
    balance: round(balance, 4),
    balanceAdjustment: round(balanceAdjustment, 4),
    sampleReliability: round(sampleReliability, 4),
    weightingModel: "RECENCY_EXPONENTIAL_V11_3_4",
    probabilityModel: "DRAW_RATE_ANCHORED_V11_3_4",
    modelVersion: "DH-11.3.4",
    historyTarget: 30
  };
}
function emptyStats(){return {games:0,effectiveGames:0,drawRate:0,lowScoringRate:0,bttsRate:0,averageGoalsFor:0,averageGoalsAgainst:0,newestMatchDate:null,oldestMatchDate:null};}
function clamp(v,min,max){return Math.max(min,Math.min(max,v));}
function round(v,d=2){const f=10**d;return Math.round((Number(v)||0)*f)/f;}
