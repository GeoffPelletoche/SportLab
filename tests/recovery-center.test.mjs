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
