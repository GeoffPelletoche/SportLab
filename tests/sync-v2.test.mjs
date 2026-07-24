import test from "node:test";
import assert from "node:assert/strict";
import { resolveConflicts } from "../core/sync/conflictResolver.js";

class MemoryStorage {
  constructor() { this.values = new Map(); }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
}
globalThis.localStorage = new MemoryStorage();
const { queueManager } = await import("../core/sync/queueManager.js");

test("queue V2 déduplique les changements par namespace et clé", () => {
  queueManager.clear();
  queueManager.enqueue([{ namespace: "bets", key: "a", payload: { n: 1 }, clientUpdatedAt: 1 }]);
  queueManager.enqueue([{ namespace: "bets", key: "a", payload: { n: 2 }, clientUpdatedAt: 2 }]);
  assert.equal(queueManager.size(), 1);
  assert.equal(queueManager.list()[0].payload.n, 2);
});

test("queue V2 conserve un élément en échec avec backoff", () => {
  const item = queueManager.list()[0];
  queueManager.fail([item], "offline");
  const failed = queueManager.list()[0];
  assert.equal(failed.attempts, 1);
  assert.ok(failed.nextAttemptAt > Date.now());
  assert.equal(failed.lastError, "offline");
});

test("résolution LWW choisit la donnée la plus récente", () => {
  const result = resolveConflicts([{
    server: { namespace: "bets", key: "a", clientUpdatedAt: 10, version: 2 },
    client: { namespace: "bets", key: "a", clientUpdatedAt: 20, baseVersion: 1 }
  }]);
  assert.equal(result.localToRetry.length, 1);
  assert.equal(result.localToRetry[0].baseVersion, 2);
  assert.equal(result.decisions[0].winner, "client");
});
