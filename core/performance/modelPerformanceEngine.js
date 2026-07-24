import { buildCalibration } from "./calibrationEngine.js";
function moduleOf(item = {}) { const raw = String(item.moduleId || item.source || item.sport || item.type || "").toLowerCase(); return raw.includes("draw") || raw.includes("foot") ? "drawhunter" : raw.includes("french") || raw.includes("rugby") ? "frenchflair" : "unknown"; }
function resultOf(item = {}) { const value = String(item.result || item.status || item.settlement || "").toLowerCase(); return value.includes("win") || value.includes("gagn") ? true : value.includes("loss") || value.includes("perd") ? false : null; }
export function buildModelPerformance(records = []) {
  const groups = { drawhunter: [], frenchflair: [] };
  records.forEach(item => { const moduleId = moduleOf(item); if (groups[moduleId]) groups[moduleId].push(item); });
  return Object.fromEntries(Object.entries(groups).map(([moduleId, items]) => [moduleId, summarize(moduleId, items)]));
}
function summarize(moduleId, items) {
  const settled = items.map(item => ({ ...item, won: resultOf(item) })).filter(item => item.won !== null);
  const wins = settled.filter(item => item.won).length;
  const stakes = settled.reduce((sum, item) => sum + (Number(item.stake ?? item.amount ?? item.mise) || 0), 0);
  const profit = settled.reduce((sum, item) => sum + (Number(item.profit ?? item.netProfit ?? item.pnl) || 0), 0);
  const roi = stakes > 0 ? profit / stakes * 100 : 0;
  const calibrationRecords = settled.map(item => ({ probability: Number(item.probability ?? item.modelProbability ?? item.drawProbability ?? item.overProbability), won: item.won }));
  return { moduleId, predictions: items.length, evaluated: settled.length, wins, hitRate: settled.length ? wins / settled.length * 100 : 0, stakes, profit, roi, calibration: buildCalibration(calibrationRecords) };
}
