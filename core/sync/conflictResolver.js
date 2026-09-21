function timestamp(record) {
  return Number(record?.clientUpdatedAt || record?.client_updated_at || record?.serverUpdatedAt || record?.server_updated_at || 0);
}
function fingerprint(record) {
  if (record?.fingerprint) return String(record.fingerprint);
  try { return JSON.stringify({ deleted: Boolean(record?.deleted), payload: record?.payload ?? null }); }
  catch { return String(record?.payload ?? ""); }
}

// V11.6.0 Safe Recovery: ambiguous 409 conflicts no longer use Last-Write-Wins.
// Explicit Cloud tombstones remain authoritative (V11.3.12 safety contract), and
// a conflict without any local counterpart may safely accept the server record.
export function resolveConflicts(conflicts = [], localQueue = []) {
  const localByKey = new Map(localQueue.map(item => [`${item.namespace}:${item.key}`, item]));
  const recordsToApply = [];
  const decisions = [];
  for (const conflict of conflicts) {
    const server = conflict.server || conflict.current || conflict.record;
    if (!server) continue;
    const namespace = server.namespace || conflict.namespace;
    const key = server.key || server.recordKey || server.record_key || conflict.key;
    const local = conflict.client || conflict.local || localByKey.get(`${namespace}:${key}`);
    const authoritativeServerDelete = Boolean(server.deleted);
    const serverWins = authoritativeServerDelete || !local;
    if (serverWins) recordsToApply.push(server);
    decisions.push({
      namespace, key, winner: serverWins ? "server" : "pending", reason: serverWins ? (authoritativeServerDelete ? "authoritative-delete" : "no-local-counterpart") : "version-conflict",
      serverTimestamp: timestamp(server), clientTimestamp: timestamp(local),
      serverVersion: Number(server.version || 0), localFingerprint: fingerprint(local), serverFingerprint: fingerprint(server)
    });
  }
  return { recordsToApply, localToRetry: [], decisions };
}
