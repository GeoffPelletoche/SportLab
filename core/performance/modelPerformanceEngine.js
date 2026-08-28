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
  const analyses = Array.isArray(input?.analyses) ? input.analyses : [];
  const workflows = input?.workflows && typeof input.workflows === "object" ? input.workflows : {};
  return {
    drawhunter: summarize("drawhunter", dataset, learning, bets, legacy, analyses, workflows.drawhunter || {}),
    frenchflair: summarize("frenchflair", dataset, learning, bets, legacy, analyses, workflows.frenchflair || {})
  };
}

function summarize(moduleId, dataset, learning, bets, legacy = [], analyses = [], workflow = {}) {
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

  /*
   * V11.3.5 — la qualité de décision est reconstruite depuis la décision
   * réellement sauvegardée (workflow / analyse / Bet Store), plutôt que
   * depuis le snapshot brut capturé avant saisie de la cote.
   *
   * Cela répare également les anciennes évaluations DrawHunter déjà
   * enregistrées avec GOOD_VALUE / BAD_VALUE par défaut.
   */
  const decisionEvaluations = evaluated
    .map(item => ({
      ...item,
      resolvedDecisionQuality: resolveDecisionQuality({
        item,
        moduleId,
        bets,
        analyses,
        workflow
      })
    }))
    .filter(item => item.resolvedDecisionQuality);

  const goodPasses = decisionEvaluations.filter(item => item.resolvedDecisionQuality === "GOOD_PASS").length;
  const missedOpportunities = decisionEvaluations.filter(item => item.resolvedDecisionQuality === "MISSED_OPPORTUNITY").length;
  const goodValues = decisionEvaluations.filter(item => item.resolvedDecisionQuality === "GOOD_VALUE").length;
  const badValues = decisionEvaluations.filter(item => item.resolvedDecisionQuality === "BAD_VALUE").length;
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

function resolveDecisionQuality({ item = {}, moduleId, bets = [], analyses = [], workflow = {} } = {}) {
  const matchId = item.matchId ?? item.id ?? null;
  const bet = bets.find(candidate => String(candidate?.matchId) === String(matchId));
  const analysis = analyses.find(candidate => String(candidate?.matchId) === String(matchId));
  const workflowEntry = matchId !== null && matchId !== undefined ? workflow[String(matchId)] : null;

  const decisionType = resolveDecisionType({
    item,
    bet,
    analysis,
    workflowEntry
  });

  if (!decisionType) {
    return legacyDecisionQuality(item);
  }

  const occurred = eventOccurredOf(item, moduleId);
  if (typeof occurred !== "boolean") return legacyDecisionQuality(item);

  if (decisionType === "NO_VALUE") {
    return occurred ? "MISSED_OPPORTUNITY" : "GOOD_PASS";
  }
  if (decisionType === "VALUE") {
    return occurred ? "GOOD_VALUE" : "BAD_VALUE";
  }
  return null;
}

function resolveDecisionType({ item = {}, bet = null, analysis = null, workflowEntry = null } = {}) {
  const candidates = [
    workflowEntry?.decision,
    analysis?.finalDecision,
    analysis?.decision,
    bet?.decision,
    item?.modelDecision
  ];

  for (const value of candidates) {
    const raw = String(value || "").trim().toUpperCase();
    if (!raw) continue;
    if (raw.includes("NO BET") || raw.includes("NO VALUE") || raw.includes("PAS DE PARI") || raw.includes("PASS")) {
      return "NO_VALUE";
    }
    if (raw === "VALUE" || raw.includes("VALUE BET") || raw.includes("BET VALUE")) {
      return "VALUE";
    }
  }

  if (bet?.placed === true) return "VALUE";
  if (bet && bet?.placed === false) return "NO_VALUE";
  if (String(item?.userDecision || "").toUpperCase() === "BET") return "VALUE";
  if (String(item?.userDecision || "").toUpperCase() === "NO_BET" && item?.explicitDecision === true) return "NO_VALUE";

  return null;
}

function legacyDecisionQuality(item = {}) {
  const value = String(item.decisionQuality || "").toUpperCase();
  return ["GOOD_PASS", "MISSED_OPPORTUNITY", "GOOD_VALUE", "BAD_VALUE"].includes(value) ? value : null;
}

function eventOccurredOf(item = {}, moduleId) {
  if (typeof item.eventOccurred === "boolean") return item.eventOccurred;

  if (moduleId === "frenchflair" && typeof item.predictionCorrect === "boolean") {
    return item.predictionCorrect;
  }

  return null;
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
