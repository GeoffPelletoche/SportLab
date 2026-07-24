import { scoreAnalysis } from "../scoring/unifiedScoringEngine.js";
import { getModelVersion } from "./modelVersioning.js";
export function createPredictionSnapshot(analysis, moduleId) {
  const score = scoreAnalysis(analysis, moduleId);
  return { id: `${moduleId}:${analysis.id ?? analysis.fixtureId ?? analysis.matchId ?? "unknown"}`, moduleId, matchId: analysis.id ?? analysis.fixtureId ?? analysis.matchId ?? null, capturedAt: new Date().toISOString(), modelVersion: getModelVersion(moduleId), probability: analysis.drawProbability ?? analysis.probability ?? analysis.recommendedProbability ?? analysis.overProbability ?? analysis.underProbability ?? null, confidence: score.confidence, unifiedScore: score.unifiedScore, prediction: analysis.recommendedTrend ?? analysis.decision ?? analysis.prediction ?? null, competition: analysis.competition ?? null, date: analysis.date ?? null, features: { sigma: analysis.sigma ?? null, predictedTotalPoints: analysis.predictedTotalPoints ?? null, historicalReferenceTotal: analysis.historicalReferenceTotal ?? null } };
}
