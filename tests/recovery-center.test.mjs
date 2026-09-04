import test from "node:test";
import assert from "node:assert/strict";
import { createRecoveryManager } from "../core/sync/recoveryManager.js";
import { createEventBus } from "../core/events/eventBus.js";

function installBrowserMocks() {
  const store = new Map();
  global.localStorage = {
    get length() { return store.size; },
    key(index) { return [...store.keys()][index] ?? null; },
    getItem(key) { return store.has(key) ? store.get(key) : null; },
    setItem(key, value) { store.set(key, String(value)); },
    removeItem(key) { store.delete(key); }
  };
  global.window = { dispatchEvent() {} };
  global.CustomEvent = class { constructor(type, init) { this.type = type; this.detail = init?.detail; } };
}

function manager(cloudRecords = []) {
  installBrowserMocks();
  const syncEngine = {
    api: { snapshot: async () => ({ records: cloudRecords }), restore: async records => ({ accepted: records, conflicts: [] }) },
    getStatus: () => ({ deviceId: "device-test" }),
    syncNow: async () => ({ ok: true })
  };
  return createRecoveryManager({ syncEngine, eventBus: createEventBus(), logger: { info() {} }, notifications: { success() {} } });
}

test("Recovery Center crée et restaure un snapshot local", () => {
  const recovery = manager();
  localStorage.setItem("sportlab_analyses_v1", JSON.stringify([{ id: 1 }]));
  const snapshot = recovery.createSnapshot("test");
  localStorage.setItem("sportlab_analyses_v1", JSON.stringify([{ id: 2 }]));
  recovery.restoreSnapshot(snapshot.id);
  assert.equal(JSON.parse(localStorage.getItem("sportlab_analyses_v1"))[0].id, 1);
  assert.ok(recovery.listJournal().length >= 3);
});

test("Recovery Center compare Local et Cloud sans mutation", async () => {
  const cloud = [{ namespace: "analyses", key: "sportlab_analyses_v1", payload: { storageKey: "sportlab_analyses_v1", raw: JSON.stringify([{ id: 2 }]) }, deleted: false, version: 2 }];
  const recovery = manager(cloud);
  localStorage.setItem("sportlab_analyses_v1", JSON.stringify([{ id: 1 }]));
  const preview = await recovery.preview();
  assert.equal(preview.comparison.changed, 8);
  assert.equal(preview.comparison.differences.find(item => item.key === "sportlab_analyses_v1").status, "different");
  assert.equal(JSON.parse(localStorage.getItem("sportlab_analyses_v1"))[0].id, 1);
});

test("Recovery Center ne journalise pas deux fois le même conflit", () => {
  installBrowserMocks();
  const listeners = new Map();
  const eventBus = { on(name, handler) { listeners.set(name, handler); } };
  const syncEngine = {
    api: { snapshot: async () => ({ records: [] }) },
    getStatus: () => ({ deviceId: "device-test" }),
    syncNow: async () => ({ ok: true })
  };
  const recovery = createRecoveryManager({ syncEngine, eventBus, logger: { info() {} }, notifications: { success() {} } });
  const handler = listeners.get("sync:conflict");
  const payload = {
    at: 12345,
    conflicts: [{
      namespace: "bets", key: "sportlab_bets_v3",
      server: { namespace: "bets", key: "sportlab_bets_v3", version: 7, clientUpdatedAt: 100 },
      client: { namespace: "bets", key: "sportlab_bets_v3", clientUpdatedAt: 200, fingerprint: "abc" }
    }],
    decisions: [{ namespace: "bets", key: "sportlab_bets_v3", winner: "client", serverTimestamp: 100, clientTimestamp: 200, serverVersion: 7, localFingerprint: "abc", serverFingerprint: "def" }]
  };
  handler(payload);
  handler(payload);
  assert.equal(recovery.listConflicts().length, 1);
  assert.equal(recovery.listJournal().filter(item => item.type === "conflict").length, 1);
});
