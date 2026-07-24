import { createPredictionSnapshot } from "./predictionSnapshot.js";
const KEY = "sportlab.v7.learning.dataset";
export function capturePredictionDataset({ drawhunter = [], frenchflair = [] } = {}, storage = globalThis.localStorage) {
  let current = []; try { current = JSON.parse(storage?.getItem?.(KEY) || "[]"); if (!Array.isArray(current)) current = []; } catch { current = []; }
  const map = new Map(current.map(item => [`${item.id}:${item.modelVersion}`, item]));
  [["drawhunter", drawhunter], ["frenchflair", frenchflair]].forEach(([moduleId, items]) => items.forEach(item => { if (!item || typeof item !== "object") return; const snapshot = createPredictionSnapshot(item, moduleId); map.set(`${snapshot.id}:${snapshot.modelVersion}`, snapshot); }));
  const dataset = [...map.values()].slice(-10000); storage?.setItem?.(KEY, JSON.stringify(dataset)); return dataset;
}
export function readLearningDataset(storage = globalThis.localStorage) { try { const value = JSON.parse(storage?.getItem?.(KEY) || "[]"); return Array.isArray(value) ? value : []; } catch { return []; } }
