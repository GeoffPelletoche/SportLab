const DEFAULT_BUCKET_SIZE = 10;
const MIN_RELIABLE_SAMPLE = 20;
const MIN_COMPETITION_SAMPLE = 10;

export function buildCalibrationDashboard(records = [], options = {}) {
  const usable = normalizeCalibrationRecords(records);
  const global = summarizeCalibration(usable, options);
  const modules = {
    drawhunter: summarizeCalibration(usable.filter(item => item.moduleId === "drawhunter"), options),
    frenchflair: summarizeCalibration(usable.filter(item => item.moduleId === "frenchflair"), options)
  };

  const competitions = groupCalibration(usable, item => item.competition || "Compétition inconnue", options)
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "fr"));

  const confidenceBands = buildBuckets(usable, options.bucketSize || DEFAULT_BUCKET_SIZE);
  const calibratedCompetitions = competitions.filter(item => item.count >= MIN_COMPETITION_SAMPLE).length;
  const lastUpdatedAt = usable
    .map(item => item.evaluatedAt)
    .filter(Boolean)
    .sort()
    .at(-1) || null;

  return {
    engineStatus: "ACTIVE_PASSIVE",
    totalRecords: Array.isArray(records) ? records.length : 0,
    observations: usable.length,
    excluded: Math.max(0, (Array.isArray(records) ? records.length : 0) - usable.length),
    global,
    modules,
    competitions,
    confidenceBands,
    calibratedCompetitions,
    lastUpdatedAt,
    minimumReliableSample: MIN_RELIABLE_SAMPLE,
    modelModified: false
  };
}

export function summarizeCalibration(records = [], options = {}) {
  const normalized = (Array.isArray(records) ? records : []).every(
    item => Number.isFinite(item?.probabilityPercent) && typeof item?.outcome === "boolean"
  )
    ? records
    : normalizeCalibrationRecords(records);
  const count = normalized.length;
  const buckets = buildBuckets(normalized, options.bucketSize || DEFAULT_BUCKET_SIZE);

  if (!count) {
    return emptySummary();
  }

  const meanPredicted = average(normalized.map(item => item.probabilityPercent));
  const observedRate = average(normalized.map(item => item.outcome ? 100 : 0));
  const ece = buckets.reduce((sum, bucket) => {
    if (!bucket.count) return sum;
    return sum + (bucket.count / count) * Math.abs(bucket.meanPredicted - bucket.observedRate);
  }, 0);
  const brierScore = average(normalized.map(item => {
    const probability = item.probabilityPercent / 100;
    const outcome = item.outcome ? 1 : 0;
    return (probability - outcome) ** 2;
  }));
  const score = clamp(100 - ece, 0, 100);

  return {
    count,
    meanPredicted: round(meanPredicted, 1),
    observedRate: round(observedRate, 1),
    expectedCalibrationError: round(ece, 1),
    brierScore: round(brierScore, 4),
    score: round(score, 1),
    reliability: count >= MIN_RELIABLE_SAMPLE ? "RELIABLE" : "LIMITED_SAMPLE",
    ...calibrationGrade(score, count),
    buckets
  };
}

export function calibrationGrade(score, count = MIN_RELIABLE_SAMPLE) {
  if (count < MIN_RELIABLE_SAMPLE) {
    return {
      grade: "PENDING",
      label: "Échantillon insuffisant",
      tone: "neutral",
      icon: "⚪"
    };
  }
  if (score >= 92) return { grade: "EXCELLENT", label: "Excellente", tone: "success", icon: "🟢" };
  if (score >= 88) return { grade: "VERY_GOOD", label: "Très bonne", tone: "success", icon: "🟢" };
  if (score >= 80) return { grade: "CORRECT", label: "Correcte", tone: "warning", icon: "🟡" };
  if (score >= 70) return { grade: "WATCH", label: "À surveiller", tone: "caution", icon: "🟠" };
  return { grade: "WEAK", label: "Faible", tone: "danger", icon: "🔴" };
}

export function normalizeCalibrationRecords(records = []) {
  return (Array.isArray(records) ? records : [])
    .map(normalizeCalibrationRecord)
    .filter(Boolean);
}

function normalizeCalibrationRecord(record = {}) {
  if (!record?.evaluatedAt) return null;
  const probabilityPercent = normalizeProbability(record.probability);
  const outcome = deriveOutcome(record, probabilityPercent);
  if (!Number.isFinite(probabilityPercent) || typeof outcome !== "boolean") return null;
  return {
    learningId: record.learningId || null,
    moduleId: normalizeModule(record.moduleId || record.source || record.sport),
    competition: String(record.competition || "Compétition inconnue"),
    probabilityPercent,
    outcome,
    evaluatedAt: record.evaluatedAt
  };
}

function deriveOutcome(record, probabilityPercent) {
  if (typeof record.eventOccurred === "boolean") return record.eventOccurred;
  if (typeof record.actualOutcome === "boolean") return record.actualOutcome;

  const moduleId = normalizeModule(record.moduleId || record.source || record.sport);
  const result = String(record.result || "").toUpperCase();
  if (!result || ["PUSH", "VOID", "NOT_EVALUABLE"].includes(result)) return null;

  if (moduleId === "drawhunter") {
    const predictedDraw = probabilityPercent >= 30;
    if (result === "WON") return predictedDraw;
    if (result === "LOST") return !predictedDraw;
  }

  if (moduleId === "frenchflair") {
    if (result === "WON") return true;
    if (result === "LOST") return false;
  }

  if (typeof record.predictionCorrect === "boolean") return record.predictionCorrect;
  return null;
}

function buildBuckets(records, bucketSize) {
  const size = Math.max(5, Math.min(25, Number(bucketSize) || DEFAULT_BUCKET_SIZE));
  const buckets = [];
  for (let min = 0; min < 100; min += size) {
    buckets.push({
      min,
      max: Math.min(100, min + size - 1),
      count: 0,
      predictedSum: 0,
      actualSum: 0
    });
  }
  if (buckets.at(-1)?.max < 100) buckets.at(-1).max = 100;

  for (const item of records) {
    const index = Math.min(buckets.length - 1, Math.floor(item.probabilityPercent / size));
    const bucket = buckets[index];
    bucket.count += 1;
    bucket.predictedSum += item.probabilityPercent;
    bucket.actualSum += item.outcome ? 100 : 0;
  }

  return buckets.map(bucket => {
    const meanPredicted = bucket.count ? bucket.predictedSum / bucket.count : 0;
    const observedRate = bucket.count ? bucket.actualSum / bucket.count : 0;
    return {
      min: bucket.min,
      max: bucket.max,
      count: bucket.count,
      meanPredicted: round(meanPredicted, 1),
      observedRate: round(observedRate, 1),
      gap: round(observedRate - meanPredicted, 1)
    };
  });
}

function groupCalibration(records, keyFn, options) {
  const groups = new Map();
  for (const record of records) {
    const key = keyFn(record);
    const items = groups.get(key) || [];
    items.push(record);
    groups.set(key, items);
  }
  return [...groups.entries()].map(([label, items]) => ({
    ...summarizeCalibration(items, options),
    label
  }));
}

function normalizeProbability(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) return NaN;
  return clamp(number <= 1 ? number * 100 : number, 0, 100);
}

function normalizeModule(value) {
  const normalized = String(value || "").toLowerCase();
  if (normalized.includes("draw") || normalized.includes("foot")) return "drawhunter";
  if (normalized.includes("french") || normalized.includes("rugby")) return "frenchflair";
  return "unknown";
}

function emptySummary() {
  return {
    count: 0,
    meanPredicted: 0,
    observedRate: 0,
    expectedCalibrationError: 0,
    brierScore: 0,
    score: 0,
    reliability: "LIMITED_SAMPLE",
    ...calibrationGrade(0, 0),
    buckets: buildBuckets([], DEFAULT_BUCKET_SIZE)
  };
}

function average(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}
function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
function round(value, digits = 1) {
  const power = 10 ** digits;
  return Math.round((Number(value) + Number.EPSILON) * power) / power;
}
