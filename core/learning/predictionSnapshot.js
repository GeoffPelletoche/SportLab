import { scoreAnalysis } from "../scoring/unifiedScoringEngine.js";
import { getModelVersion } from "./modelVersioning.js";
export function createPredictionSnapshot(analysis, moduleId) {
  const score = scoreAnalysis(analysis, moduleId);
  const matchId = analysis.matchId ?? analysis.fixtureId ?? analysis.id ?? null;
  return {
    id: `${moduleId}:${matchId ?? "unknown"}`,
    moduleId,
    matchId,
    capturedAt: new Date().toISOString(),
    modelVersion: getModelVersion(moduleId),
    probability: analysis.drawProbability ?? analysis.probability ?? analysis.recommendedProbability ?? analysis.overProbability ?? analysis.underProbability ?? null,
    confidence: score.confidence,
    unifiedScore: score.unifiedScore,
    prediction: analysis.recommendedTrend ?? analysis.market ?? analysis.prediction ?? "DRAW",
    modelDecision: analysis.finalDecision ?? analysis.decision ?? null,
    value: analysis.value ?? null,
    odds: analysis.odds ?? null,
    line: analysis.line ?? null,
    competition: analysis.competition ?? null,
    date: analysis.date ?? analysis.matchDate ?? null,
    features: {
      sigma: analysis.sigma ?? null,
      predictedTotalPoints: analysis.predictedTotalPoints ?? null,
      historicalReferenceTotal: analysis.historicalReferenceTotal ?? null
    }
  };
}
