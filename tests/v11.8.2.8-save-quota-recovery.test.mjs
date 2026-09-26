import test from "node:test";
import assert from "node:assert/strict";
import { quotaSafeSetItem, purgeRecoverableLocalCache } from "../core/stores/quotaSafeStorage.js";

function storageWithQuota() {
  const data = new Map([
    ["sportlab.v9.history.rugby.120", "cache-a"],
    ["sportlab.v9.history.football.44", "cache-b"],
    ["sportlab_analyses_v1", "important-analysis"],
    ["sportlab_bets_v1", "important-bet"],
    ["sportlab.v7.cloud.queue.v2", "important-cloud"]
  ]);
  let first = true;
  return {
    get length(){ return data.size; },
    key(i){ return [...data.keys()][i] ?? null; },
    getItem(k){ return data.get(k) ?? null; },
    removeItem(k){ data.delete(k); },
    setItem(k,v){ if(first){ first=false; const e=new Error("quota exceeded"); e.name="QuotaExceededError"; throw e; } data.set(k,v); },
    data
  };
}

test("quota recovery purges only disposable history caches then retries the save", () => {
  const storage = storageWithQuota();
  const result = quotaSafeSetItem("sportlab_analyses_v1", "new-analysis", storage);
  assert.equal(result.recovered, true);
  assert.equal(result.purged, 2);
  assert.equal(storage.getItem("sportlab_analyses_v1"), "new-analysis");
  assert.equal(storage.getItem("sportlab_bets_v1"), "important-bet");
  assert.equal(storage.getItem("sportlab.v7.cloud.queue.v2"), "important-cloud");
  assert.equal([...storage.data.keys()].some(k => k.startsWith("sportlab.v9.history.")), false);
});

test("purgeRecoverableLocalCache never deletes analyses, bets, workflows or cloud queue", () => {
  const storage = storageWithQuota(); storage.setItem = (k,v) => storage.data.set(k,v);
  purgeRecoverableLocalCache(storage);
  assert.equal(storage.getItem("sportlab_analyses_v1"), "important-analysis");
  assert.equal(storage.getItem("sportlab_bets_v1"), "important-bet");
  assert.equal(storage.getItem("sportlab.v7.cloud.queue.v2"), "important-cloud");
});
