// SPORTLAB V11.8.1 — Last-known-good sports snapshots.
// IndexedDB avoids Safari localStorage quota pressure. Writes are atomic per sport.
const DB_NAME = "sportlab-sports-snapshots";
const DB_VERSION = 1;
const STORE = "snapshots";
const SCHEMA_VERSION = 1;
const MAX_STALE_MS = 72 * 60 * 60 * 1000;

function hasIndexedDb() { return typeof indexedDB !== "undefined"; }
function openDb() {
  return new Promise((resolve, reject) => {
    if (!hasIndexedDb()) return reject(new Error("IndexedDB unavailable"));
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "sport" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Snapshot DB unavailable"));
  });
}

export async function readSportsSnapshot(sport) {
  try {
    const db = await openDb();
    const record = await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(sport);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
    db.close();
    if (!record || record.schemaVersion !== SCHEMA_VERSION || !record.payload) return null;
    const ageMs = Date.now() - Number(record.savedAt || 0);
    if (!Number.isFinite(ageMs) || ageMs < 0 || ageMs > MAX_STALE_MS) return null;
    return { payload: record.payload, savedAt: record.savedAt, ageMs };
  } catch (error) {
    console.warn("[SportsSnapshot] Lecture impossible", sport, error);
    return null;
  }
}

export async function writeSportsSnapshot(sport, payload) {
  if (!sport || !payload || payload?.meta?.error === true || payload?.meta?.loading === true) return false;
  try {
    const db = await openDb();
    const record = { sport, schemaVersion: SCHEMA_VERSION, savedAt: Date.now(), payload };
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(record);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error("Snapshot write failed"));
      tx.onabort = () => reject(tx.error || new Error("Snapshot write aborted"));
    });
    db.close();
    return true;
  } catch (error) {
    console.warn("[SportsSnapshot] Écriture impossible", sport, error);
    return false;
  }
}

export function snapshotPayloadForDisplay(snapshot, sport) {
  if (!snapshot?.payload) return null;
  return {
    ...snapshot.payload,
    meta: {
      ...(snapshot.payload.meta || {}),
      sport,
      loading: false,
      snapshot: true,
      snapshotSavedAt: new Date(snapshot.savedAt).toISOString(),
      snapshotAgeMs: snapshot.ageMs,
      refreshingInBackground: true
    }
  };
}
