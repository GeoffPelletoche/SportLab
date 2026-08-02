export const LEARNING_STORAGE_KEY = "sportlab_learning_v1";
const MAX_RECORDS = 10000;

export function getLearningRecords(storage = globalThis.localStorage) {
  try {
    const value = JSON.parse(storage?.getItem?.(LEARNING_STORAGE_KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function saveLearningRecord(record, storage = globalThis.localStorage) {
  if (!record || typeof record !== "object" || !record.learningId) return null;
  const records = getLearningRecords(storage);
  const index = records.findIndex(item => item.learningId === record.learningId);
  const normalized = normalizeRecord(record);
  if (index >= 0) records[index] = { ...records[index], ...normalized };
  else records.push(normalized);
  storage?.setItem?.(LEARNING_STORAGE_KEY, JSON.stringify(records.slice(-MAX_RECORDS)));
  return normalized;
}

export function buildLearningSummary(records = getLearningRecords()) {
  const evaluated = records.filter(item => item.evaluatedAt);
  const predictionCorrect = evaluated.filter(item => item.predictionCorrect === true).length;
  const decisionCorrect = evaluated.filter(item => item.decisionCorrect === true).length;
  const byCompetition = groupSummary(evaluated, item => item.competition || "Compétition inconnue");
  const byModule = groupSummary(evaluated, item => item.moduleId || "unknown");
  const factors = buildFactorSummary(evaluated);
  const maturity = getLearningMaturity(evaluated);
  return {
    total: records.length,
    evaluated: evaluated.length,
    pending: Math.max(0, records.length - evaluated.length),
    predictionAccuracy: rate(predictionCorrect, evaluated.length),
    decisionAccuracy: rate(decisionCorrect, evaluated.length),
    byCompetition,
    byModule,
    factors,
    maturity
  };
}

export function getLearningMaturity(records = getLearningRecords()) {
  const evaluated = records.filter(item => item?.evaluatedAt);
  const count = evaluated.length;
  const competitions = new Set(evaluated.map(item => item.competition).filter(Boolean)).size;
  const modules = new Set(evaluated.map(item => item.moduleId).filter(Boolean)).size;
  let level = 0;
  let label = "Observation";
  let nextThreshold = 200;
  if (count >= 1000 && competitions >= 5 && modules >= 2) {
    level = 3; label = "Candidat éligible"; nextThreshold = null;
  } else if (count >= 500 && competitions >= 3) {
    level = 2; label = "Validation avancée"; nextThreshold = 1000;
  } else if (count >= 200) {
    level = 1; label = "Validation silencieuse"; nextThreshold = 500;
  }
  return {
    level,
    label,
    evaluated: count,
    competitions,
    modules,
    nextThreshold,
    modelCanChangeAutomatically: false,
    candidateAvailable: false,
    message: level === 0
      ? `SportLab observe encore les résultats. ${Math.max(0, 200 - count)} évaluations avant la validation silencieuse.`
      : level === 1
        ? "SportLab compare passivement des variantes sans modifier les prédictions."
        : level === 2
          ? "L’échantillon devient exploitable, mais aucun changement de modèle n’est automatique."
          : "Un modèle candidat pourra être étudié uniquement après démonstration d’un gain stable et validation utilisateur."
  };
}

function normalizeRecord(record) {
  return {
    ...record,
    probability: nullableNumber(record.probability),
    confidence: nullableNumber(record.confidence),
    odds: nullableNumber(record.odds),
    stake: nullableNumber(record.stake) || 0,
    profit: nullableNumber(record.profit) || 0,
    factors: Array.isArray(record.factors) ? record.factors : [],
    updatedAt: new Date().toISOString()
  };
}

function groupSummary(records, keyFn) {
  const groups = new Map();
  for (const item of records) {
    const key = keyFn(item);
    const current = groups.get(key) || { key, total: 0, predictionCorrect: 0, decisionCorrect: 0 };
    current.total += 1;
    if (item.predictionCorrect === true) current.predictionCorrect += 1;
    if (item.decisionCorrect === true) current.decisionCorrect += 1;
    groups.set(key, current);
  }
  return [...groups.values()].map(item => ({
    ...item,
    predictionAccuracy: rate(item.predictionCorrect, item.total),
    decisionAccuracy: rate(item.decisionCorrect, item.total)
  })).sort((a, b) => b.total - a.total);
}

function buildFactorSummary(records) {
  const factors = new Map();
  for (const record of records) {
    for (const factor of record.factors || []) {
      const key = factor.key || factor.label;
      if (!key) continue;
      const current = factors.get(key) || { key, label: factor.label || key, uses: 0, correct: 0, positiveUses: 0 };
      current.uses += 1;
      if (record.predictionCorrect === true) current.correct += 1;
      if (["positive", "favorable"].includes(String(factor.tone || "").toLowerCase())) current.positiveUses += 1;
      factors.set(key, current);
    }
  }
  return [...factors.values()].map(item => ({ ...item, successRate: rate(item.correct, item.uses) })).sort((a, b) => b.uses - a.uses);
}

function rate(value, total) { return total ? Math.round((value / total) * 1000) / 10 : 0; }
function nullableNumber(value) { const number = Number(value); return Number.isFinite(number) ? number : null; }
