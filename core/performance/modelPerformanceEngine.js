import { buildCalibration } from "./calibrationEngine.js";

function moduleOf(item = {}) {
  const raw = String(item.moduleId || item.source || item.sport || item.type || "").toLowerCase();
  return raw.includes("draw") || raw.includes("foot") ? "drawhunter" : raw.includes("french") || raw.includes("rugby") ? "frenchflair" : "unknown";
}
function normalizedResult(item = {}) {
  const value = String(item.result || item.status || item.settlement || "").trim().toUpperCase();
  if (value === "WIN") return "WON";
  if (value === "LOSS") return "LOST";
  return value;
}
function probabilityOf(item = {}) {
  const raw = Number(item.probability ?? item.modelProbability ?? item.drawProbability ?? item.overProbability);
  if (!Number.isFinite(raw)) return null;
  return raw <= 1 ? raw * 100 : raw;
}
function unique(items = [], keyFn) {
  const map = new Map();
  items.forEach((item, index) => map.set(keyFn(item, index), item));
  return [...map.values()];
}

/**
 * V11.3.2 — les métriques ne sont plus déduites d'un balayage générique de
 * localStorage. Chaque famille possède sa source de vérité :
 * - dataset : nombre de prédictions capturées ;
 * - learning : prédictions/ décisions effectivement évaluées ;
 * - bets : ROI et profit réels des paris placés et réglés.
 *
 * Le mode tableau est conservé pour les anciens tests/appels.
 */
export function buildModelPerformance(input = []) {
  if (Array.isArray(input)) return buildLegacyPerformance(input);
  const dataset = Array.isArray(input?.dataset) ? input.dataset : [];
  const learning = Array.isArray(input?.learning) ? input.learning : [];
  const bets = Array.isArray(input?.bets) ? input.bets : [];
  const legacy = Array.isArray(input?.legacy) ? input.legacy : [];
  return {
    drawhunter: summarize("drawhunter", dataset, learning, bets, legacy),
    frenchflair: summarize("frenchflair", dataset, learning, bets, legacy)
  };
}

function summarize(moduleId, dataset, learning, bets, legacy = []) {
  const predictions = unique(dataset.filter(item => moduleOf(item) === moduleId), item => `${item.id || item.matchId}:${item.modelVersion || "model"}`);
  const learningEvaluated = learning.filter(item => moduleOf(item) === moduleId && item?.evaluatedAt);
  // Compatibilité avec les évaluations V7–V11.1 déjà persistées avant le Learning Store.
  const legacyEvaluated = legacy.filter(item => moduleOf(item) === moduleId && (item?.evaluatedAt || ["WON", "LOST", "WIN", "LOSS"].includes(normalizedResult(item))));
  const evaluated = unique([...legacyEvaluated, ...learningEvaluated], item => item.learningId || item.evaluationId || `${item.snapshotId || item.matchId || item.id}:${item.modelVersion || "model"}`);
  const evaluable = evaluated.map(item => ({
    ...item,
    predictionCorrect: typeof item.predictionCorrect === "boolean" ? item.predictionCorrect : normalizedResult(item) === "WON" ? true : normalizedResult(item) === "LOST" ? false : null
  })).filter(item => typeof item.predictionCorrect === "boolean");
  const wins = evaluable.filter(item => item.predictionCorrect === true).length;

  const placedSettled = bets.filter(item => moduleOf(item) === moduleId && item?.placed === true && ["WON", "LOST", "PUSH"].includes(normalizedResult(item)));
  let stakes = 0, profit = 0;
  for (const bet of placedSettled) {
    const stake = Math.max(0, Number(bet.stake) || 0);
    const odds = Math.max(0, Number(bet.odds) || 0);
    const result = normalizedResult(bet);
    stakes += stake;
    if (result === "WON") profit += stake * (odds - 1);
    else if (result === "LOST") profit -= stake;
  }
  const roi = stakes > 0 ? profit / stakes * 100 : 0;

  const goodPasses = evaluated.filter(item => item.decisionQuality === "GOOD_PASS").length;
  const missedOpportunities = evaluated.filter(item => item.decisionQuality === "MISSED_OPPORTUNITY").length;
  const goodValues = evaluated.filter(item => item.decisionQuality === "GOOD_VALUE").length;
  const badValues = evaluated.filter(item => item.decisionQuality === "BAD_VALUE").length;
  const decisionsEvaluated = goodPasses + missedOpportunities + goodValues + badValues;
  const decisionScore = decisionsEvaluated ? (goodPasses + goodValues) / decisionsEvaluated * 100 : 0;

  const calibrationRecords = evaluable.map(item => ({ probability: probabilityOf(item), won: item.predictionCorrect === true })).filter(item => Number.isFinite(item.probability));
  return {
    moduleId,
    predictions: predictions.length,
    evaluated: evaluable.length,
    wins,
    hitRate: evaluable.length ? wins / evaluable.length * 100 : 0,
    settledBets: placedSettled.length,
    stakes,
    profit,
    roi,
    calibration: buildCalibration(calibrationRecords),
    goodPasses, missedOpportunities, goodValues, badValues, decisionsEvaluated, decisionScore
  };
}

function buildLegacyPerformance(records) {
  const groups = { drawhunter: [], frenchflair: [] };
  records.forEach(item => { const moduleId = moduleOf(item); if (groups[moduleId]) groups[moduleId].push(item); });
  return Object.fromEntries(Object.entries(groups).map(([moduleId, items]) => {
    const settled = items.filter(item => ["WON", "LOST"].includes(normalizedResult(item)));
    const wins = settled.filter(item => normalizedResult(item) === "WON").length;
    const stakes = settled.reduce((sum, item) => sum + (Number(item.stake ?? item.amount ?? item.mise) || 0), 0);
    const profit = settled.reduce((sum, item) => {
      if (Number.isFinite(Number(item.profit ?? item.netProfit ?? item.pnl))) return sum + Number(item.profit ?? item.netProfit ?? item.pnl);
      const stake = Number(item.stake ?? item.amount ?? item.mise) || 0, odds = Number(item.odds) || 0;
      return sum + (normalizedResult(item) === "WON" ? stake * (odds - 1) : -stake);
    }, 0);
    return [moduleId, { moduleId, predictions: items.length, evaluated: settled.length, wins, hitRate: settled.length ? wins / settled.length * 100 : 0, stakes, profit, roi: stakes ? profit / stakes * 100 : 0, calibration: buildCalibration(settled.map(item => ({ probability: probabilityOf(item), won: normalizedResult(item) === "WON" }))), goodPasses:0, missedOpportunities:0, goodValues:0, badValues:0, decisionsEvaluated:0, decisionScore:0 }];
  }));
}
