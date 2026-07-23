import { syncConfigStore } from "./syncConfigStore.js";
import { createCloudApi } from "./cloudApi.js";
import { collectLocalChanges, applyRemoteRecords, acknowledgeChanges, hasLocalSportLabData } from "./localDataAdapter.js";
import { queueManager } from "./queueManager.js";
import { resolveConflicts } from "./conflictResolver.js";

function platformLabel() { return [navigator.platform, navigator.userAgentData?.platform].filter(Boolean)[0] || "web"; }
function deviceName() { return `${platformLabel()} · ${navigator.userAgent.includes("Mobile") ? "Mobile" : "Navigateur"}`; }
function randomId() { return crypto.randomUUID ? crypto.randomUUID() : `device-${Date.now()}-${Math.random().toString(16).slice(2)}`; }

export function createSyncEngine({ eventBus, logger, notifications }) {
  const api = createCloudApi({ getConfig: syncConfigStore.get });
  let timer = null; let syncing = false; let started = false;
  const emit = (status, extra = {}) => eventBus.emit("cloud:status", { status, config: syncConfigStore.get(), queueSize: queueManager.size(), ...extra });

  async function ensureDevice() {
    let config = syncConfigStore.get();
    if (config.deviceId) return config.deviceId;
    const id = randomId(); const result = await api.registerDevice({ id, name: deviceName(), platform: platformLabel() });
    config = syncConfigStore.set({ deviceId: result.device.id }); return config.deviceId;
  }

  async function initialReconcile() {
    const config = syncConfigStore.get(); if (config.initialMigrationDone) return;
    const snapshot = await api.snapshot(); const remote = snapshot.records || [];
    if (remote.length) applyRemoteRecords(remote);
    else if (hasLocalSportLabData()) queueManager.enqueue(collectLocalChanges());
    syncConfigStore.set({ initialMigrationDone: true });
  }

  async function syncNow({ silent = false } = {}) {
    const config = syncConfigStore.get();
    if (!config.enabled || !config.token) { emit("disconnected"); return { skipped: true }; }
    if (!navigator.onLine) { queueManager.enqueue(collectLocalChanges()); emit("offline"); return { offline: true }; }
    if (syncing) return { busy: true };
    syncing = true; emit("syncing");
    try {
      await api.me(); const deviceId = await ensureDevice(); await initialReconcile();
      queueManager.enqueue(collectLocalChanges());
      const queued = queueManager.list();
      if (queued.length) {
        try {
          const pushed = await api.push({ deviceId, changes: queued });
          acknowledgeChanges(pushed.accepted || pushed.records || []); queueManager.clear();
        } catch (error) {
          if (error.status !== 409) throw error;
          const remote = resolveConflicts(error.payload?.conflicts || error.details?.conflicts || []); applyRemoteRecords(remote); queueManager.clear();
        }
      }
      let cursor = Number(syncConfigStore.get().cursor || 0); let more = true;
      while (more) {
        const pulled = await api.pull(cursor, 500); applyRemoteRecords(pulled.records || pulled.changes || []);
        cursor = Number(pulled.cursor ?? pulled.nextCursor ?? cursor); more = Boolean(pulled.hasMore);
      }
      const now = Date.now(); syncConfigStore.set({ cursor, lastSyncAt: now, lastError: "" }); emit("synced", { lastSyncAt: now });
      if (!silent) notifications.success("Les données SportLab sont synchronisées.", "Cloud SportLab");
      return { ok: true, cursor };
    } catch (error) {
      logger.error("Échec de synchronisation cloud", { message: error.message, code: error.code });
      syncConfigStore.set({ lastError: error.message }); emit("error", { error: error.message });
      if (!silent) notifications.error(error.message, "Synchronisation impossible"); throw error;
    } finally { syncing = false; }
  }

  function schedule(delay = 30_000) { clearInterval(timer); timer = setInterval(() => syncNow({ silent: true }).catch(() => {}), delay); }
  function start() {
    if (started) return; started = true;
    window.addEventListener("online", () => syncNow({ silent: true }).catch(() => {}));
    window.addEventListener("offline", () => emit("offline"));
    window.addEventListener("storage", event => { if (event.key && !event.key.startsWith("sportlab.v7.cloud")) queueManager.enqueue(collectLocalChanges()); });
    ["sportlab:bets-updated", "sportlab:drawhunter-workflow-updated", "sportlab:frenchflair-workflow-updated"].forEach(name => window.addEventListener(name, () => { queueManager.enqueue(collectLocalChanges()); setTimeout(() => syncNow({ silent: true }).catch(() => {}), 300); }));
    schedule(); syncNow({ silent: true }).catch(() => {});
  }
  function stop() { clearInterval(timer); timer = null; started = false; }
  async function connect({ endpoint, token }) { syncConfigStore.set({ endpoint, token, enabled: true, lastError: "" }); await syncNow(); }
  function disconnect() { stop(); syncConfigStore.set({ enabled: false, token: "", deviceId: "", cursor: 0, initialMigrationDone: false }); emit("disconnected"); }
  return Object.freeze({ start, stop, syncNow, connect, disconnect, api, getStatus: () => ({ ...syncConfigStore.get(), queueSize: queueManager.size(), online: navigator.onLine }) });
}
