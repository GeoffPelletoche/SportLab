import { clampScore } from "./scoringSchema.js";
function finite(value) { const n = Number(value); return Number.isFinite(n) ? n : null; }
export function computeConfidence(analysis = {}, moduleId = "unknown") {
  const explicit = finite(analysis.confidence);
  const sample = finite(analysis.sampleSize ?? analysis.matchesAnalyzed ?? analysis.historyCount);
  const sigma = finite(analysis.sigma);
  const probability = finite(analysis.drawProbability ?? analysis.probability ?? analysis.recommendedProbability ?? analysis.overProbability ?? analysis.underProbability);
  const completenessFields = moduleId === "frenchflair"
    ? [analysis.predictedTotalPoints, analysis.sigma, analysis.historicalReferenceTotal, analysis.recommendedTrend]
    : [analysis.drawProbability ?? analysis.probability, analysis.home, analysis.away, analysis.competition];
  const completeness = completenessFields.filter(value => value !== undefined && value !== null && value !== "").length / completenessFields.length;
  const stability = sigma === null ? 0.55 : Math.max(0, Math.min(1, 1 - Math.max(0, sigma - 8) / 24));
  const sampleQuality = sample === null ? 0.55 : Math.max(0, Math.min(1, sample / 30));
  const probabilityClarity = probability === null ? 0.5 : Math.min(1, Math.abs(probability - 50) / 25 + 0.35);
  const computed = (completeness * 35) + (stability * 25) + (sampleQuality * 25) + (probabilityClarity * 15);
  return clampScore(explicit === null ? computed : explicit * 0.6 + computed * 0.4);
}
