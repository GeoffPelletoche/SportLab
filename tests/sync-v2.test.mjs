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
globalThis.window = { dispatchEvent() {} };
const { queueManager } = await import("../core/sync/queueManager.js");
const { collectLocalChanges } = await import("../core/sync/localDataAdapter.js");

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

test("queue V2 ne réinitialise pas le backoff pour le même fingerprint", () => {
  const item = queueManager.list()[0];
  const delayedUntil = item.nextAttemptAt;
  queueManager.enqueue([{ ...item, payload: { n: 2 } }]);
  const preserved = queueManager.list()[0];
  assert.equal(preserved.attempts, 1);
  assert.equal(preserved.nextAttemptAt, delayedUntil);
});

test("queue V2 réinitialise le backoff lorsqu'une nouvelle donnée arrive", () => {
  queueManager.enqueue([{ namespace: "bets", key: "a", payload: { n: 3 }, fingerprint: "new-value", clientUpdatedAt: 3 }]);
  const fresh = queueManager.list()[0];
  assert.equal(fresh.attempts, 0);
  assert.equal(fresh.nextAttemptAt, 0);
});

test("capture locale conserve le même timestamp tant que le fingerprint en attente ne change pas", () => {
  localStorage.removeItem("sportlab.v7.cloud.meta");
  localStorage.setItem("sportlab_bets_v3", JSON.stringify({ test: 1 }));
  const first = collectLocalChanges().find(item => item.key === "sportlab_bets_v3");
  assert.ok(first);
  const second = collectLocalChanges().find(item => item.key === "sportlab_bets_v3");
  assert.ok(second);
  assert.equal(second.fingerprint, first.fingerprint);
  assert.equal(second.clientUpdatedAt, first.clientUpdatedAt);
  localStorage.setItem("sportlab_bets_v3", JSON.stringify({ test: 2 }));
  const third = collectLocalChanges().find(item => item.key === "sportlab_bets_v3");
  assert.ok(third);
  assert.notEqual(third.fingerprint, first.fingerprint);
  assert.ok(third.clientUpdatedAt >= first.clientUpdatedAt);
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
