import fs from "node:fs/promises";
import path from "node:path";
import { loadDrawHunterApplicationData, loadFrenchFlairApplicationData, loadNflApplicationData } from "../services/appService.js";

// Browser caches are optional in CI. Keep the service code unchanged and provide a tiny in-memory shim.
if (!globalThis.localStorage) {
  const memory = new Map();
  globalThis.localStorage = {
    getItem: key => memory.has(String(key)) ? memory.get(String(key)) : null,
    setItem: (key, value) => memory.set(String(key), String(value)),
    removeItem: key => memory.delete(String(key)),
    clear: () => memory.clear()
  };
}

const loaders = {
  drawhunter: loadDrawHunterApplicationData,
  frenchflair: loadFrenchFlairApplicationData,
  nfl: loadNflApplicationData
};
const sports = {};
const failures = [];
for (const [kind, load] of Object.entries(loaders)) {
  const payload = await load();
  const logs = Array.isArray(payload?.meta?.syncLog) ? payload.meta.syncLog : [];
  const badLogs = logs.filter(item => ["ERROR", "RATE_LIMITED"].includes(String(item?.status || "").toUpperCase()));
  const historyErrors = Number(payload?.meta?.historyDiagnostics?.errors || 0);
  if (payload?.meta?.error === true || badLogs.length || historyErrors > 0) {
    failures.push(`${kind}: ${badLogs.length} competition error(s), ${historyErrors} history error(s)`);
    continue;
  }
  sports[kind] = payload;
}
if (failures.length) throw new Error(`Server snapshot refused (atomic publish): ${failures.join("; ")}`);
if (Object.keys(sports).length !== 3) throw new Error("Server snapshot refused: all three sports are required.");
const document = { schemaVersion: 1, generatedAt: new Date().toISOString(), version: "11.8.2.2", sports };
const output = path.resolve("data/server-snapshot.json");
await fs.writeFile(output, JSON.stringify(document), "utf8");
console.log(`[SportLab] Server snapshot written: ${output}`);
for (const [kind, payload] of Object.entries(sports)) console.log(`[SportLab] ${kind}: ${payload.matches?.length || 0} match(es)`);
