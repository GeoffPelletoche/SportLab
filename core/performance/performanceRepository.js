const KEY = "sportlab.v7.modelPerformance.records";
export function createPerformanceRepository(storage = globalThis.localStorage) {
  const read = () => { try { const value = JSON.parse(storage?.getItem?.(KEY) || "[]"); return Array.isArray(value) ? value : []; } catch { return []; } };
  const write = records => storage?.setItem?.(KEY, JSON.stringify(records.slice(-5000)));
  const collectFromStorage = () => { const records = [...read()]; if (!storage) return records; for (let index = 0; index < storage.length; index += 1) { const key = storage.key(index) || ""; if (key === KEY || key.includes("learning")) continue; let value; try { value = JSON.parse(storage.getItem(key)); } catch { continue; } const items = Array.isArray(value) ? value : value && typeof value === "object" ? Object.values(value) : []; items.forEach(item => { if (item && typeof item === "object" && (item.result || item.settlement || item.profit !== undefined)) records.push(item); }); } return records; };
  return Object.freeze({ read, write, collectFromStorage, key: KEY });
}
