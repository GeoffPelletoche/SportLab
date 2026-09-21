const SNAPSHOTS_KEY = "sportlab.v7.cloud.recovery.snapshots";
const JOURNAL_KEY = "sportlab.v7.cloud.recovery.journal";
const MAX_SNAPSHOTS = 20;
const MAX_JOURNAL = 100;

function read(key, fallback = []) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } }
function uid(prefix) { return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`; }
function clone(value) { return JSON.parse(JSON.stringify(value)); }
function rawOf(record) { return record?.deleted ? null : record?.payload?.raw ?? null; }
function keyOf(record) { return record?.payload?.storageKey || record?.key || record?.record_key || ""; }
function summarize(records = []) {
  const result = { total: 0, analyses: 0, bets: 0, drawhunter: 0, frenchflair: 0, settings: 0 };
  for (const record of records) {
    if (record?.deleted) continue;
    const key = keyOf(record).toLowerCase(); let count = 1;
    try { const parsed = JSON.parse(rawOf(record)); count = Array.isArray(parsed) ? parsed.length : parsed && typeof parsed === "object" ? Object.keys(parsed).length : parsed == null ? 0 : 1; }
    catch { count = rawOf(record) == null ? 0 : 1; }
    result.total += count;
    if (key.includes("analys")) result.analyses += count;
    if (key.includes("bet") || key.includes("pari")) result.bets += count;
    if (key.includes("drawhunter")) result.drawhunter += count;
    if (key.includes("frenchflair")) result.frenchflair += count;
    if (key.includes("settings")) result.settings += count;
  }
  return result;
}
function persistWithQuotaRecovery(key, items, maxItems) {
  let next = items.slice(0, maxItems);
  while (true) {
    try { localStorage.setItem(key, JSON.stringify(next)); return next; }
    catch (error) {
      const quota = error?.name === "QuotaExceededError" || /quota.*exceed/i.test(String(error?.message || ""));
      if (!quota || next.length <= 1) {
        const wrapped = new Error("Snapshot de sécurité impossible : stockage local insuffisant. Aucune donnée Cloud n’a été appliquée.");
        wrapped.code = "safe_recovery_snapshot_failed"; wrapped.cause = error; throw wrapped;
      }
      next = next.slice(0, -1); // prune oldest snapshot before giving up
    }
  }
}
export function createRecoverySnapshot(records, reason = "avant-fusion-cloud") {
  const snapshots = read(SNAPSHOTS_KEY);
  const snapshot = { id: uid("snapshot"), createdAt: Date.now(), reason, records: clone(records), summary: summarize(records) };
  persistWithQuotaRecovery(SNAPSHOTS_KEY, [snapshot, ...snapshots], MAX_SNAPSHOTS);
  try {
    const journal = read(JOURNAL_KEY);
    localStorage.setItem(JOURNAL_KEY, JSON.stringify([{ id: uid("journal"), at: Date.now(), type: "snapshot", message: "Snapshot local créé", detail: { snapshotId: snapshot.id, reason } }, ...journal].slice(0, MAX_JOURNAL)));
  } catch { /* snapshot itself is the safety-critical write */ }
  window.dispatchEvent(new CustomEvent("sportlab:recovery-updated"));
  return snapshot;
}
export { SNAPSHOTS_KEY, JOURNAL_KEY };
