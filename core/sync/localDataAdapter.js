export const SYNCED_KEYS = Object.freeze([
  "sportlab_analyses_v1", "sportlab_bets_v3",
  "sportlab_drawhunter_workflow_v1", "sportlab_drawhunter_context_v1",
  "sportlab_frenchflair_workflow_v1", "sportlab_frenchflair_context_v1",
  "sportlab.v7.settings"
]);
const META_KEY = "sportlab.v7.cloud.meta";
function meta() { try { return JSON.parse(localStorage.getItem(META_KEY)) || {}; } catch { return {}; } }
function saveMeta(value) { localStorage.setItem(META_KEY, JSON.stringify(value)); }
function namespaceFor(key) { return key === "sportlab.v7.settings" ? "settings" : key.includes("drawhunter") ? "drawhunter" : key.includes("frenchflair") ? "frenchflair" : key.includes("bets") ? "bets" : "analyses"; }
function recordKeyFor(key) { return key; }
function hash(value) { let h = 2166136261; for (let i = 0; i < value.length; i += 1) { h ^= value.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(16); }
export function collectLocalChanges() {
  const state = meta(); const now = Date.now(); const changes = [];
  for (const key of SYNCED_KEYS) {
    const raw = localStorage.getItem(key); const fingerprint = hash(raw ?? "__deleted__"); const entry = state[key] || {};
    if (entry.hash === fingerprint) continue;
    changes.push({ namespace: namespaceFor(key), key: recordKeyFor(key), payload: raw === null ? null : { storageKey: key, raw }, deleted: raw === null, clientUpdatedAt: now, baseVersion: Number(entry.version || 0) });
  }
  return changes;
}
export function applyRemoteRecords(records = []) {
  const state = meta(); let changed = false;
  for (const record of records) {
    const key = record?.payload?.storageKey || record?.key || record?.record_key;
    if (!SYNCED_KEYS.includes(key)) continue;
    const deleted = Boolean(record.deleted);
    const raw = record?.payload?.raw ?? null;
    if (deleted) localStorage.removeItem(key); else if (typeof raw === "string" && localStorage.getItem(key) !== raw) { localStorage.setItem(key, raw); changed = true; }
    state[key] = { hash: hash(deleted ? "__deleted__" : String(raw)), version: Number(record.version || 0), serverUpdatedAt: Number(record.serverUpdatedAt || record.server_updated_at || Date.now()) };
  }
  saveMeta(state);
  if (changed) window.dispatchEvent(new CustomEvent("sportlab:cloud-data-applied"));
  return changed;
}
export function acknowledgeChanges(accepted = []) {
  const state = meta();
  for (const item of accepted) {
    const key = item.key || item.recordKey || item.record_key; if (!SYNCED_KEYS.includes(key)) continue;
    const raw = localStorage.getItem(key); state[key] = { hash: hash(raw ?? "__deleted__"), version: Number(item.version || 0), serverUpdatedAt: Number(item.serverUpdatedAt || Date.now()) };
  }
  saveMeta(state);
}
export function hasLocalSportLabData() { return SYNCED_KEYS.some(key => localStorage.getItem(key) !== null); }
export function exportLocalSnapshot() { return SYNCED_KEYS.map(key => ({ namespace: namespaceFor(key), key, payload: localStorage.getItem(key) === null ? null : { storageKey: key, raw: localStorage.getItem(key) }, deleted: localStorage.getItem(key) === null, clientUpdatedAt: Date.now(), baseVersion: 0 })); }
