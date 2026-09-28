import { createPredictionSnapshot } from "./predictionSnapshot.js";
import { quotaSafeSetItem } from "../stores/quotaSafeStorage.js";
export const LEARNING_DATASET_KEY = "sportlab.v7.learning.dataset";
const KEY = LEARNING_DATASET_KEY;
export function capturePredictionDataset({ drawhunter = [], frenchflair = [], nfl = [], analyses = [] } = {}, storage = globalThis.localStorage) {
  let current = []; try { current = JSON.parse(storage?.getItem?.(KEY) || "[]"); if (!Array.isArray(current)) current = []; } catch { current = []; }
  const map = new Map(current.map(item => [`${item.id}:${item.modelVersion}`, item]));
  [["drawhunter", drawhunter], ["frenchflair", frenchflair], ["nfl", nfl]].forEach(([moduleId, items]) => items.forEach(item => { if (!item || typeof item !== "object") return; const snapshot = createPredictionSnapshot(item, moduleId); map.set(`${snapshot.id}:${snapshot.modelVersion}`, { ...map.get(`${snapshot.id}:${snapshot.modelVersion}`), ...snapshot }); }));
  analyses.forEach(item => { if (!item || typeof item !== "object") return; const source = String(item.source || item.sport || "").toLowerCase(); const moduleId = source.includes("nfl") || source.includes("american") ? "nfl" : source.includes("draw") || (source.includes("foot") && !source.includes("american")) ? "drawhunter" : "frenchflair"; const snapshot = createPredictionSnapshot(item, moduleId); map.set(`${snapshot.id}:${snapshot.modelVersion}`, { ...map.get(`${snapshot.id}:${snapshot.modelVersion}`), ...snapshot }); });
  const dataset = [...map.values()].slice(-10000); quotaSafeSetItem(KEY, JSON.stringify(dataset), storage); return dataset;
}
export function readLearningDataset(storage = globalThis.localStorage) { try { const value = JSON.parse(storage?.getItem?.(KEY) || "[]"); return Array.isArray(value) ? value : []; } catch { return []; } }
