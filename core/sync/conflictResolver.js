function timestamp(record) {
  return Number(record?.clientUpdatedAt || record?.client_updated_at || record?.serverUpdatedAt || record?.server_updated_at || 0);
}
function fingerprint(record) {
  if (record?.fingerprint) return String(record.fingerprint);
  try { return JSON.stringify({ deleted: Boolean(record?.deleted), payload: record?.payload ?? null }); }
  catch { return String(record?.payload ?? ""); }
}

export function resolveConflicts(conflicts = [], localQueue = []) {
  const localByKey = new Map(localQueue.map(item => [`${item.namespace}:${item.key}`, item]));
  const recordsToApply = [];
  const localToRetry = [];
  const decisions = [];

  for (const conflict of conflicts) {
    const server = conflict.server || conflict.current || conflict.record;
    if (!server) continue;
    const namespace = server.namespace || conflict.namespace;
    const key = server.key || server.recordKey || server.record_key || conflict.key;
    const local = conflict.client || conflict.local || localByKey.get(`${namespace}:${key}`);
    const serverVersion = Number(server.version || 0);
    // V11.3.12 — un tombstone déjà présent côté Cloud est toujours autoritaire
    // lors d'un conflit. Un ancien appareil ne peut donc pas le contourner avec
    // une version de base ou un timestamp local incohérent.
    const authoritativeServerDelete = Boolean(server.deleted);
    const serverWins = authoritativeServerDelete || !local || timestamp(server) >= timestamp(local);
    if (serverWins) recordsToApply.push(server);
    else localToRetry.push({ ...local, baseVersion: Number(server.version || 0) });
    decisions.push({
      namespace, key, winner: serverWins ? "server" : "client",
      serverTimestamp: timestamp(server), clientTimestamp: timestamp(local),
      serverVersion: Number(server.version || 0), localFingerprint: fingerprint(local), serverFingerprint: fingerprint(server)
    });
  }

  return { recordsToApply, localToRetry, decisions };
}
