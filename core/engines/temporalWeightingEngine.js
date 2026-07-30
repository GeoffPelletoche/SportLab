/**
 * SPORTLAB V8 — TEMPORAL WEIGHTING ENGINE
 * Historique glissant multi-saisons pondéré par ancienneté réelle.
 */
export const TEMPORAL_WEIGHTING_DEFAULTS = Object.freeze({
  maxMatches: 30,
  minimumWeight: 0.4,
  decay: 0.97
});

export function prepareWeightedHistory(history = [], options = {}) {
  const config = { ...TEMPORAL_WEIGHTING_DEFAULTS, ...options };
  const maxMatches = clampInteger(config.maxMatches, 1, 100);
  const minimumWeight = clampNumber(config.minimumWeight, 0.05, 1);
  const decay = clampNumber(config.decay, 0.5, 1);

  return history
    .filter(Boolean)
    .map((game, sourceIndex) => ({ ...game, sourceIndex, timestamp: parseTimestamp(game.date) }))
    .filter(game => Number.isFinite(game.timestamp))
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, maxMatches)
    .map((game, index) => ({
      ...game,
      recencyRank: index + 1,
      temporalWeight: round(Math.max(minimumWeight, Math.pow(decay, index)), 4)
    }));
}

export function weightedMean(values, weights) {
  const pairs = zipFinite(values, weights);
  if (!pairs.length) return 0;
  const weightSum = pairs.reduce((sum, pair) => sum + pair.weight, 0);
  if (weightSum <= 0) return 0;
  return pairs.reduce((sum, pair) => sum + pair.value * pair.weight, 0) / weightSum;
}

export function weightedStdDev(values, weights) {
  const pairs = zipFinite(values, weights);
  if (pairs.length < 2) return 0;
  const mean = weightedMean(pairs.map(p => p.value), pairs.map(p => p.weight));
  const weightSum = pairs.reduce((sum, pair) => sum + pair.weight, 0);
  if (weightSum <= 0) return 0;
  const variance = pairs.reduce(
    (sum, pair) => sum + pair.weight * Math.pow(pair.value - mean, 2),
    0
  ) / weightSum;
  return Math.sqrt(variance);
}

export function weightedRate(items, predicate, weightSelector = item => item.temporalWeight ?? 1) {
  const valid = items.filter(Boolean);
  if (!valid.length) return 0;
  const totalWeight = valid.reduce((sum, item) => sum + positiveWeight(weightSelector(item)), 0);
  if (totalWeight <= 0) return 0;
  const successWeight = valid.reduce(
    (sum, item) => sum + (predicate(item) ? positiveWeight(weightSelector(item)) : 0),
    0
  );
  return successWeight / totalWeight;
}

export function effectiveSampleSize(items, weightSelector = item => item.temporalWeight ?? 1) {
  const weights = items.map(weightSelector).map(positiveWeight).filter(weight => weight > 0);
  if (!weights.length) return 0;
  const sum = weights.reduce((a, b) => a + b, 0);
  const squared = weights.reduce((a, b) => a + b * b, 0);
  return squared > 0 ? (sum * sum) / squared : 0;
}

function zipFinite(values = [], weights = []) {
  return values.map((value, index) => ({ value: Number(value), weight: positiveWeight(weights[index]) }))
    .filter(pair => Number.isFinite(pair.value) && pair.weight > 0);
}
function positiveWeight(value) { const number = Number(value); return Number.isFinite(number) && number > 0 ? number : 0; }
function parseTimestamp(value) { const time = new Date(value).getTime(); return Number.isFinite(time) ? time : NaN; }
function clampInteger(value, min, max) { return Math.round(clampNumber(value, min, max)); }
function clampNumber(value, min, max) { const number = Number(value); return Math.max(min, Math.min(max, Number.isFinite(number) ? number : min)); }
function round(value, digits = 2) { const factor = 10 ** digits; return Math.round(value * factor) / factor; }
