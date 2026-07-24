import { computeConfidence } from "./confidenceEngine.js";
import { MODEL_VERSIONS, SCORING_SCHEMA_VERSION, clampScore } from "./scoringSchema.js";
export function scoreAnalysis(analysis = {}, moduleId = "unknown") {
  const confidence = computeConfidence(analysis, moduleId);
  const dataQuality = clampScore(confidence * 0.55 + (analysis.predictionStatus === "OK" ? 35 : 10));
  const stability = clampScore(analysis.sigma ? 100 - Math.max(0, Number(analysis.sigma) - 8) * 4 : confidence);
  const unifiedScore = clampScore(confidence * 0.6 + dataQuality * 0.25 + stability * 0.15);
  return Object.freeze({ moduleId, unifiedScore, confidence, dataQuality, stability, schemaVersion: SCORING_SCHEMA_VERSION, modelVersion: MODEL_VERSIONS[moduleId] || "SPORTLAB-7.2.0" });
}
