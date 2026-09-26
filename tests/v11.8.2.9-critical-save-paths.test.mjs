import test from "node:test";
import assert from "node:assert/strict";
import { saveAnalysis } from "../core/stores/analysisStore.js";
import { saveBet } from "../core/stores/betsStore.js";

function quotaStorage(targetKey) {
  const data = new Map([
    ["sportlab.v9.history.rugby.120", "cache-a"],
    ["sportlab.v9.history.football.44", "cache-b"],
    ["sportlab.v7.cloud.queue.v2", "cloud-important"]
  ]);
  let thrown = false;
  return {
    get length() { return data.size; },
    key(i) { return [...data.keys()][i] ?? null; },
    getItem(k) { return data.get(k) ?? null; },
    removeItem(k) { data.delete(k); },
    setItem(k, v) {
      if (k === targetKey && !thrown) {
        thrown = true;
        const error = new Error("quota exceeded");
        error.name = "QuotaExceededError";
        throw error;
      }
      data.set(k, v);
    },
    data
  };
}

function installBrowserGlobals(storage) {
  globalThis.localStorage = storage;
  globalThis.window = { dispatchEvent() {} };
  globalThis.CustomEvent = class CustomEvent { constructor(type, init = {}) { this.type = type; this.detail = init.detail; } };
}

test("saveAnalysis recovers from Safari quota without deleting Cloud data", () => {
  const storage = quotaStorage("sportlab_analyses_v1");
  installBrowserGlobals(storage);
  const saved = saveAnalysis({ matchId: 42, match: "A - B", decision: "VALUE" });
  assert.ok(saved?.id);
  const rows = JSON.parse(storage.getItem("sportlab_analyses_v1"));
  assert.equal(rows.length, 1);
  assert.equal(rows[0].matchId, 42);
  assert.equal(storage.getItem("sportlab.v7.cloud.queue.v2"), "cloud-important");
  assert.equal([...storage.data.keys()].some(k => k.startsWith("sportlab.v9.history.")), false);
});

test("saveBet recovers from Safari quota and persists the bet", () => {
  const storage = quotaStorage("sportlab_bets_v3");
  installBrowserGlobals(storage);
  const saved = saveBet({ source: "FrenchFlair", sport: "rugby", matchId: 99, market: "OVER", line: 45.5, odds: 1.9, placed: true, stake: 1 });
  assert.ok(saved?.id);
  const rows = JSON.parse(storage.getItem("sportlab_bets_v3"));
  assert.equal(rows.length, 1);
  assert.equal(rows[0].matchId, 99);
  assert.equal(rows[0].placed, true);
  assert.equal(storage.getItem("sportlab.v7.cloud.queue.v2"), "cloud-important");
  assert.equal([...storage.data.keys()].some(k => k.startsWith("sportlab.v9.history.")), false);
});
