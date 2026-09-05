import { syncConfigStore } from "./syncConfigStore.js";
import { createCloudApi } from "./cloudApi.js";
import { collectLocalChanges, applyRemoteRecords, acknowledgeChanges, hasLocalSportLabData } from "./localDataAdapter.js";
import { queueManager } from "./queueManager.js";
import { resolveConflicts } from "./conflictResolver.js";
import { createDiffEngine } from "./diffEngine.js";
import { createSyncScheduler } from "./syncScheduler.js";
import { SYNC_EVENTS } from "./syncEvents.js";

function platformLabel() { return [navigator.userAgentData?.platform, navigator.platform].filter(Boolean)[0] || "web"; }
function deviceName() { return `${platformLabel()} · ${navigator.userAgent.includes("Mobile") ? "Mobile" : "Navigateur"}`; }
function randomId() { return crypto.randomUUID ? crypto.randomUUID() : `device-${Date.now()}-${Math.random().toString(16).slice(2)}`; }
function chunks(items, size = 250) { const result = []; for (let i = 0; i < items.length; i += size) result.push(items.slice(i, i + size)); return result; }

export function createSyncEngine({ eventBus, logger, notifications }) {
  const api = createCloudApi({ getConfig: syncConfigStore.get });
  const diff = createDiffEngine({ collectChanges: collectLocalChanges });
  let syncing = false;
  let rerunRequested = false;
  let lastReason = "manual";

  const emit = (status, extra = {}) => {
    const payload = { status, config: syncConfigStore.get(), queueSize: queueManager.size(), queue: queueManager.diagnostics(), ...extra };
    eventBus.emit(SYNC_EVENTS.STATUS, payload);
    return payload;
  };
  const emitEvent = (name, detail = {}) => eventBus.emit(name, { at: Date.now(), ...detail });

  async function ensureDevice() {
    let config = syncConfigStore.get();
    if (config.deviceId) return config.deviceId;
    const id = randomId();
    const result = await api.registerDevice({ id, name: deviceName(), platform: platformLabel() });
    config = syncConfigStore.set({ deviceId: result.device.id });
    return config.deviceId;
  }

  async function initialReconcile() {
    const config = syncConfigStore.get();
    if (config.initialMigrationDone) return;
    const snapshot = await api.snapshot();
    const remote = snapshot.records || [];
    if (remote.length) applyRemoteRecords(remote);
    else if (hasLocalSportLabData()) { diff.markDirty(); queueManager.enqueue(diff.scan({ force: true })); }
    syncConfigStore.set({ initialMigrationDone: true });
  }

  function captureChanges({ force = false } = {}) {
    const changes = diff.scan({ force });
    if (changes.length) {
      queueManager.enqueue(changes);
      emitEvent(SYNC_EVENTS.QUEUE, { added: changes.length, queueSize: queueManager.size() });
    }
    return changes;
  }

  async function pushQueue(deviceId) {
    const ready = queueManager.ready();
    if (!ready.length) return { accepted: 0, conflicts: 0 };
    let acceptedCount = 0;
    let conflictCount = 0;
    for (const batch of chunks(ready, 250)) {
      emitEvent(SYNC_EVENTS.PUSH, { phase: "start", count: batch.length });
      try {
        const pushed = await api.push({ deviceId, changes: batch });
        const accepted = pushed.accepted || pushed.records || [];
        acknowledgeChanges(accepted);
        queueManager.acknowledge(accepted);
        acceptedCount += accepted.length;
      } catch (error) {
        if (error.status !== 409) {
          queueManager.fail(batch, error.message);
          throw error;
        }
        const payload = error.payload || {};
        const accepted = payload.accepted || [];
        if (accepted.length) { acknowledgeChanges(accepted); queueManager.acknowledge(accepted); acceptedCount += accepted.length; }
        const conflicts = payload.conflicts || error.details?.conflicts || [];
        const resolution = resolveConflicts(conflicts, batch);
        applyRemoteRecords(resolution.recordsToApply);
        queueManager.acknowledgeKeys(resolution.recordsToApply.map(item => `${item.namespace}:${item.key || item.record_key}`));
        if (resolution.localToRetry.length) {
          queueManager.enqueue(resolution.localToRetry);
          queueManager.defer(resolution.localToRetry, "Conflit cloud — nouvelle tentative différée");
        }
        conflictCount += conflicts.length;
        emitEvent(SYNC_EVENTS.CONFLICT, { count: conflicts.length, conflicts, decisions: resolution.decisions });
      }
      emitEvent(SYNC_EVENTS.PUSH, { phase: "complete", accepted: acceptedCount, conflicts: conflictCount });
    }
    const config = syncConfigStore.get();
    syncConfigStore.set({ lastPushAt: Date.now(), totalPushes: Number(config.totalPushes || 0) + 1, totalConflicts: Number(config.totalConflicts || 0) + conflictCount, totalAcceptedChanges: Number(config.totalAcceptedChanges || 0) + acceptedCount });
    return { accepted: acceptedCount, conflicts: conflictCount };
  }

  async function pullRemote() {
    let cursor = Number(syncConfigStore.get().cursor || 0);
    let more = true;
    let applied = 0;
    while (more) {
      emitEvent(SYNC_EVENTS.PULL, { phase: "start", cursor });
      const pulled = await api.pull(cursor, 500);
      const records = pulled.records || pulled.changes || [];
      applyRemoteRecords(records);
      applied += records.length;
      cursor = Number(pulled.cursor ?? pulled.nextCursor ?? cursor);
      more = Boolean(pulled.hasMore);
    }
    const config = syncConfigStore.get();
    syncConfigStore.set({ cursor, lastPullAt: Date.now(), totalPulls: Number(config.totalPulls || 0) + 1, totalPulledChanges: Number(config.totalPulledChanges || 0) + applied });
    emitEvent(SYNC_EVENTS.PULL, { phase: "complete", cursor, applied });
    return { cursor, applied };
  }

  async function syncNow({ silent = false, reason = "manual" } = {}) {
    lastReason = reason;
    const config = syncConfigStore.get();
    if (!config.enabled || !config.token) { emit("disconnected"); return { skipped: true }; }
    captureChanges({ force: reason === "startup" || reason === "manual" });
    // V11.3.10: une protection quota héritée de V11.3.9 sans code D1 explicite
    // est considérée comme ambiguë. On la libère et on laisse le Worker confirmer
    // une éventuelle vraie limite D1 via le code d1_daily_quota_exceeded.
    if (Number(config.cloudBlockedUntil || 0) > Date.now()
      && config.cloudBlockedReason === "Quota D1 quotidien atteint"
      && config.lastErrorCode !== "d1_daily_quota_exceeded") {
      syncConfigStore.set({ cloudBlockedUntil: 0, cloudBlockedReason: "", consecutiveErrors: 0 });
      config.cloudBlockedUntil = 0;
      config.cloudBlockedReason = "";
      config.consecutiveErrors = 0;
    }
    const blockedUntil = Number(config.cloudBlockedUntil || 0);
    if (blockedUntil > Date.now()) {
      emit("error", { error: config.lastError || config.cloudBlockedReason || "Synchronisation cloud temporairement suspendue.", reason, blockedUntil, code: config.lastErrorCode || "" });
      return { blocked: true, blockedUntil, error: config.lastError || config.cloudBlockedReason || "Synchronisation cloud temporairement suspendue.", code: config.lastErrorCode || "" };
    }
    if (!navigator.onLine) { emit("offline", { reason }); return { offline: true, queued: queueManager.size() }; }
    if (syncing) { rerunRequested = true; return { busy: true, rerunScheduled: true }; }

    syncing = true;
    rerunRequested = false;
    syncConfigStore.set({ lastAttemptAt: Date.now() });
    emit("syncing", { reason });
    emitEvent(SYNC_EVENTS.START, { reason });
    try {
      const deviceId = await ensureDevice();
      await initialReconcile();
      captureChanges({ force: true });
      const pushed = await pushQueue(deviceId);
      const pulled = await pullRemote();
      const now = Date.now();
      syncConfigStore.set({ lastSyncAt: now, lastError: "", lastErrorCode: "", consecutiveErrors: 0, cloudBlockedUntil: 0, cloudBlockedReason: "" });
      emit("synced", { lastSyncAt: now, reason, pushed, pulled });
      emitEvent(SYNC_EVENTS.COMPLETE, { reason, pushed, pulled, queueSize: queueManager.size() });
      if (!silent) notifications.success("Les données SportLab sont synchronisées.", "Cloud SportLab");
      return { ok: true, ...pushed, ...pulled };
    } catch (error) {
      logger.error("Échec de synchronisation cloud", { message: error.message, code: error.code, reason });
      const current = syncConfigStore.get();
      const consecutiveErrors = Number(current.consecutiveErrors || 0) + 1;
      // Seul le code explicite renvoyé par le Worker Cloud peut déclencher
      // la suspension jusqu'au reset D1. Les messages génériques contenant
      // « quota » ne sont plus assimilés à D1.
      const isQuota = error.code === "d1_daily_quota_exceeded";
      const nextMidnightUtc = (() => { const d = new Date(); d.setUTCHours(24, 0, 0, 0); return d.getTime(); })();
      const circuitDelay = Math.min(15 * 60_000, 60_000 * (2 ** Math.min(consecutiveErrors - 1, 4)));
      const cloudBlockedUntil = isQuota ? nextMidnightUtc : (consecutiveErrors >= 3 ? Date.now() + circuitDelay : 0);
      syncConfigStore.set({
        lastError: error.message, lastErrorCode: String(error.code || ""), consecutiveErrors, cloudBlockedUntil,
        cloudBlockedReason: isQuota ? "Quota D1 quotidien atteint" : consecutiveErrors >= 3 ? "Circuit breaker cloud actif" : ""
      });
      emit("error", { error: error.message, reason, consecutiveErrors, cloudBlockedUntil });
      emitEvent(SYNC_EVENTS.ERROR, { error: error.message, code: error.code, reason });
      if (!silent) notifications.error(error.message, "Synchronisation impossible");
      if (!silent) throw error;
      return { ok: false, error: error.message };
    } finally {
      syncing = false;
      if (rerunRequested && navigator.onLine) {
        rerunRequested = false;
        setTimeout(() => syncNow({ silent: true, reason: "queued-rerun" }).catch(() => {}), 100);
      }
    }
  }

  const scheduler = createSyncScheduler({
    run: reason => syncNow({ silent: true, reason }).catch(() => {}),
    onOffline: () => { diff.markDirty(); captureChanges({ force: true }); emit("offline"); },
    intervalMs: Number(syncConfigStore.get().intervalMs || 300_000)
  });
  const watchedEvents = ["sportlab:bets-updated", "sportlab:drawhunter-workflow-updated", "sportlab:frenchflair-workflow-updated"];
  const onDomainChange = () => { diff.markDirty(); captureChanges(); scheduler.schedule("change"); };
  const onStorage = event => {
    if (!event.key || event.key.startsWith("sportlab.v7.cloud")) return;
    diff.markDirty(); captureChanges(); scheduler.schedule("storage");
  };

  function start() {
    if (scheduler.isStarted()) return;
    watchedEvents.forEach(name => window.addEventListener(name, onDomainChange));
    window.addEventListener("storage", onStorage);
    diff.markDirty();
    scheduler.start();
  }
  function stop() {
    scheduler.stop();
    watchedEvents.forEach(name => window.removeEventListener(name, onDomainChange));
    window.removeEventListener("storage", onStorage);
  }
  async function connect({ endpoint, token }) {
    syncConfigStore.set({ endpoint: String(endpoint || "").replace(/\/+$/, ""), token, enabled: true, lastError: "", lastErrorCode: "", consecutiveErrors: 0, cloudBlockedUntil: 0, cloudBlockedReason: "" });
    diff.markDirty();
    if (!scheduler.isStarted()) start();
    return syncNow({ reason: "connect" });
  }
  function disconnect() {
    stop();
    syncConfigStore.set({ enabled: false, token: "", deviceId: "", cursor: 0, initialMigrationDone: false });
    emit("disconnected");
  }
  function markDirty(reason = "api") { diff.markDirty(); captureChanges(); scheduler.schedule(reason); }
  function getStatus() {
    return { ...syncConfigStore.get(), queueSize: queueManager.size(), queue: queueManager.diagnostics(), online: navigator.onLine, syncing, rerunRequested, lastReason, diff: diff.getStatus() };
  }

  return Object.freeze({ start, stop, syncNow, connect, disconnect, markDirty, api, getStatus });
}
