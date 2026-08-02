import { getBets } from "../stores/betsStore.js";
import { getAnalysisForMatch } from "../stores/analysisStore.js";
import { saveLearningRecord } from "./learningStore.js";

export function recordPassiveLearning(snapshot, evaluation, game, evaluatedAt, storage = globalThis.localStorage) {
  const analysis = getAnalysisForMatch(snapshot.matchId);
  const bet = getBets().find(item => String(item.matchId) === String(snapshot.matchId));
  const decisionQuality = evaluation.decisionQuality || null;
  const predictionCorrect = evaluation.result === "WON";
  const decisionCorrect = ["GOOD_PASS", "GOOD_VALUE", "PUSH", "NEUTRAL_PASS"].includes(decisionQuality);
  return saveLearningRecord({
    learningId: `${snapshot.id}:${snapshot.modelVersion}`,
    snapshotId: snapshot.id,
    moduleId: snapshot.moduleId,
    modelVersion: snapshot.modelVersion,
    matchId: snapshot.matchId,
    match: analysis?.match || bet?.match || null,
    competition: snapshot.competition || analysis?.competition || bet?.competition || null,
    matchDate: snapshot.date || analysis?.date || bet?.matchDate || null,
    capturedAt: snapshot.capturedAt || null,
    evaluatedAt,
    prediction: snapshot.prediction,
    probability: snapshot.probability,
    confidence: snapshot.confidence,
    modelDecision: snapshot.modelDecision,
    userDecision: bet?.placed ? "BET" : "NO_BET",
    placed: Boolean(bet?.placed),
    odds: bet?.odds ?? snapshot.odds ?? analysis?.odds ?? null,
    stake: bet?.stake || 0,
    result: evaluation.result,
    decisionQuality,
    predictionCorrect,
    decisionCorrect,
    predictionError: evaluation.predictionError ?? null,
    finalScore: formatFinalScore(game),
    factors: normalizeFactors(snapshot.features?.explainabilityFactors || snapshot.features?.learningFactors || []),
    source: "PASSIVE_LEARNING_V11.2"
  }, storage);
}

function normalizeFactors(factors) {
  return (Array.isArray(factors) ? factors : []).map(factor => ({
    key: factor.key || factor.label || "unknown",
    label: factor.label || factor.key || "Facteur",
    value: factor.value ?? null,
    tone: factor.tone || null,
    stars: Number(factor.stars || 0)
  }));
}
function formatFinalScore(game = {}) {
  const home = game.homePoints ?? game.homeGoals;
  const away = game.awayPoints ?? game.awayGoals;
  return Number.isFinite(Number(home)) && Number.isFinite(Number(away)) ? `${home}-${away}` : null;
}
