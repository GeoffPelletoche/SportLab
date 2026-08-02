import { scoreAnalysis } from "../scoring/unifiedScoringEngine.js";
import { getModelVersion } from "./modelVersioning.js";
import { explainDrawHunterPrediction } from "../engines/drawHunterExplainabilityEngine.js";
export function createPredictionSnapshot(analysis, moduleId) {
  const score = scoreAnalysis(analysis, moduleId);
  const matchId = analysis.matchId ?? analysis.fixtureId ?? analysis.id ?? null;
  const explanation = moduleId === "drawhunter" ? explainDrawHunterPrediction(analysis, analysis.odds) : null;
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
      historicalReferenceTotal: analysis.historicalReferenceTotal ?? null,
      explainabilityFactors: explanation?.factors || buildFrenchFlairLearningFactors(analysis)
    }
  };
}


function buildFrenchFlairLearningFactors(analysis = {}) {
  return [
    { key: "sigma", label: "Sigma", value: analysis.sigma ?? null, tone: Number(analysis.sigma) > 0 ? "neutral" : "pending" },
    { key: "trend", label: "Tendance Over/Under", value: analysis.recommendedTrend ?? null, tone: "neutral" },
    { key: "model-edge", label: "Écart modèle", value: analysis.modelEdgePercent ?? analysis.edge ?? null, tone: Number(analysis.modelEdgePercent ?? analysis.edge) > 0 ? "positive" : "caution" },
    { key: "sample", label: "Confiance historique", value: analysis.confidence ?? null, tone: Number(analysis.confidence) >= 65 ? "positive" : "neutral" }
  ];
}
