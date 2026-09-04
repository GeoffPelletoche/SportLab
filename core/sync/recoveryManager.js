import { applyRemoteRecords, exportLocalSnapshot, SYNCED_KEYS } from "./localDataAdapter.js";
import { SYNC_EVENTS } from "./syncEvents.js";

const SNAPSHOTS_KEY = "sportlab.v7.cloud.recovery.snapshots";
const JOURNAL_KEY = "sportlab.v7.cloud.recovery.journal";
const CONFLICTS_KEY = "sportlab.v7.cloud.recovery.conflicts";
const MAX_SNAPSHOTS = 20;
const MAX_JOURNAL = 100;
const MAX_CONFLICTS = 100;

function read(key, fallback = []) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } }
function write(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function uid(prefix) { return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`; }
function rawOf(record) { return record?.deleted ? null : record?.payload?.raw ?? null; }
function keyOf(record) { return record?.payload?.storageKey || record?.key || record?.record_key || ""; }
function namespaceOf(record) { return record?.namespace || "unknown"; }
function now() { return Date.now(); }
function clone(value) { return JSON.parse(JSON.stringify(value)); }

function summarize(records = []) {
  const result = { total: 0, analyses: 0, bets: 0, drawhunter: 0, frenchflair: 0, settings: 0 };
  for (const record of records) {
    if (record?.deleted) continue;
    const key = keyOf(record).toLowerCase();
    let count = 1;
    try {
      const parsed = JSON.parse(rawOf(record));
      count = Array.isArray(parsed) ? parsed.length : parsed && typeof parsed === "object" ? Object.keys(parsed).length : parsed == null ? 0 : 1;
    } catch { count = rawOf(record) == null ? 0 : 1; }
    result.total += count;
    if (key.includes("analys")) result.analyses += count;
    if (key.includes("bet") || key.includes("pari")) result.bets += count;
    if (key.includes("drawhunter")) result.drawhunter += count;
    if (key.includes("frenchflair")) result.frenchflair += count;
    if (key.includes("settings")) result.settings += count;
  }
  return result;
}

function compareRecords(localRecords = [], cloudRecords = []) {
  const local = new Map(localRecords.map(record => [keyOf(record), record]));
  const cloud = new Map(cloudRecords.map(record => [keyOf(record), record]));
  const keys = [...new Set([...local.keys(), ...cloud.keys()])].filter(Boolean).sort();
  const differences = keys.map(key => {
    const localRecord = local.get(key);
    const cloudRecord = cloud.get(key);
    const localRaw = rawOf(localRecord);
    const cloudRaw = rawOf(cloudRecord);
    const status = !localRecord ? "cloud-only" : !cloudRecord ? "local-only" : localRaw === cloudRaw && Boolean(localRecord.deleted) === Boolean(cloudRecord.deleted) ? "identical" : "different";
    return {
      key,
      namespace: namespaceOf(localRecord || cloudRecord),
      status,
      localUpdatedAt: Number(localRecord?.clientUpdatedAt || localRecord?.serverUpdatedAt || 0),
      cloudUpdatedAt: Number(cloudRecord?.clientUpdatedAt || cloudRecord?.serverUpdatedAt || 0),
      localVersion: Number(localRecord?.baseVersion || localRecord?.version || 0),
      cloudVersion: Number(cloudRecord?.version || 0)
    };
  });
  return {
    localSummary: summarize(localRecords), cloudSummary: summarize(cloudRecords), differences,
    changed: differences.filter(item => item.status !== "identical").length
  };
}

export function createRecoveryManager({ syncEngine, eventBus, logger, notifications }) {
  let lastPreview = null;

  function journal(type, message, detail = {}) {
    const entries = read(JOURNAL_KEY);
    const entry = { id: uid("journal"), at: now(), type, message, detail };
    write(JOURNAL_KEY, [entry, ...entries].slice(0, MAX_JOURNAL));
    window.dispatchEvent(new CustomEvent("sportlab:recovery-updated"));
    return entry;
  }

  function createSnapshot(reason = "manual", records = exportLocalSnapshot()) {
    const snapshots = read(SNAPSHOTS_KEY);
    const snapshot = { id: uid("snapshot"), createdAt: now(), reason, records: clone(records), summary: summarize(records) };
    write(SNAPSHOTS_KEY, [snapshot, ...snapshots].slice(0, MAX_SNAPSHOTS));
    journal("snapshot", "Snapshot local créé", { snapshotId: snapshot.id, reason });
    return snapshot;
  }

  function listSnapshots() { return read(SNAPSHOTS_KEY); }
  function listJournal() { return read(JOURNAL_KEY); }
  function listConflicts() { return read(CONFLICTS_KEY); }

  async function preview() {
    const cloud = await syncEngine.api.snapshot();
    const localRecords = exportLocalSnapshot();
    const cloudRecords = cloud.records || [];
    lastPreview = { at: now(), localRecords, cloudRecords, comparison: compareRecords(localRecords, cloudRecords) };
    journal("compare", "Comparaison Local / Cloud effectuée", { changed: lastPreview.comparison.changed });
    return lastPreview;
  }

  async function restoreCloudToLocal() {
    const before = createSnapshot("avant-restauration-cloud");
    const cloud = await syncEngine.api.snapshot();
    applyRemoteRecords(cloud.records || []);
    journal("restore-cloud", "Données locales restaurées depuis le cloud", { snapshotId: before.id, records: (cloud.records || []).length });
    notifications.success("Les données locales ont été restaurées depuis le cloud.", "Recovery Center");
    return { ok: true, rollbackSnapshotId: before.id, records: (cloud.records || []).length };
  }

  async function forceLocalToCloud() {
    const cloud = await syncEngine.api.snapshot();
    createSnapshot("avant-sauvegarde-forcee-cloud");
    const versions = new Map((cloud.records || []).map(record => [keyOf(record), Number(record.version || 0)]));
    const records = exportLocalSnapshot().map(record => ({ ...record, baseVersion: versions.get(keyOf(record)) || 0, clientUpdatedAt: now() }));
    const result = await syncEngine.api.restore(records, syncEngine.getStatus().deviceId);
    journal("force-local", "Version locale sauvegardée dans le cloud", { accepted: result.accepted?.length || 0, conflicts: result.conflicts?.length || 0 });
    await syncEngine.syncNow({ silent: true, reason: "recovery-force-local" });
    notifications.success("La version locale a été envoyée dans le cloud.", "Recovery Center");
    return result;
  }

  async function smartMerge() {
    createSnapshot("avant-fusion-intelligente");
    const result = await syncEngine.syncNow({ silent: true, reason: "recovery-merge" });
    journal("merge", "Fusion intelligente terminée", result || {});
    notifications.success("La fusion intelligente est terminée.", "Recovery Center");
    return result;
  }

  function restoreSnapshot(snapshotId) {
    const snapshot = listSnapshots().find(item => item.id === snapshotId);
    if (!snapshot) throw new Error("Snapshot introuvable.");
    const safety = createSnapshot("avant-restauration-snapshot");
    applyRemoteRecords(snapshot.records || []);
    journal("rollback", "Snapshot local restauré", { restoredSnapshotId: snapshotId, safetySnapshotId: safety.id });
    notifications.success("Le snapshot sélectionné a été restauré.", "Recovery Center");
    return { ok: true, safetySnapshotId: safety.id };
  }

  function recordConflicts(payload = {}) {
    const existing = read(CONFLICTS_KEY);
    const existingIdentities = new Set(existing.map(item => [
      item.namespace, item.key, item.serverVersion, item.serverTimestamp, item.clientTimestamp, item.winner, item.localFingerprint
    ].join("|")));
    const conflicts = (payload.conflicts || payload.decisions || []).map((conflict, index) => {
      const decision = payload.decisions?.[index] || conflict;
      return {
        id: uid(`conflict-${index}`), at: payload.at || now(), status: "resolved-auto",
        namespace: conflict.namespace || conflict.current?.namespace || decision.namespace || "unknown",
        key: conflict.key || conflict.current?.key || conflict.current?.record_key || decision.key || "unknown",
        winner: decision.winner || conflict.winner || "lww",
        serverTimestamp: decision.serverTimestamp || 0,
        clientTimestamp: decision.clientTimestamp || 0,
        serverVersion: Number(decision.serverVersion || conflict.server?.version || conflict.current?.version || 0),
        localFingerprint: String(decision.localFingerprint || conflict.client?.fingerprint || ""),
        serverFingerprint: String(decision.serverFingerprint || conflict.server?.fingerprint || conflict.current?.fingerprint || "")
      };
    }).filter(item => !existingIdentities.has([
      item.namespace, item.key, item.serverVersion, item.serverTimestamp, item.clientTimestamp, item.winner, item.localFingerprint
    ].join("|")));
    if (conflicts.length) {
      write(CONFLICTS_KEY, [...conflicts, ...existing].slice(0, MAX_CONFLICTS));
      journal("conflict", `${conflicts.length} nouveau(x) conflit(s) traité(s)`, { count: conflicts.length });
    }
  }

  eventBus.on?.(SYNC_EVENTS.CONFLICT, recordConflicts);

  function getState() {
    return {
      snapshots: listSnapshots(), journal: listJournal(), conflicts: listConflicts(),
      lastPreview,
      syncedKeys: [...SYNCED_KEYS]
    };
  }

  logger.info("Recovery & Conflict Center opérationnel");
  return Object.freeze({ createSnapshot, listSnapshots, listJournal, listConflicts, preview, restoreCloudToLocal, forceLocalToCloud, smartMerge, restoreSnapshot, getState, compareRecords });
}
