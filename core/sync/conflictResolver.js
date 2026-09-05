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
    const localBaseVersion = Number(local?.baseVersion || local?.base_version || 0);
    // V11.3.11 — un tombstone Cloud plus récent que la base connue d'un ancien
    // appareil est autoritaire. Cela empêche un appareil resté hors ligne de
    // ressusciter des données volontairement remises à zéro.
    const authoritativeServerDelete = Boolean(server.deleted) && local && localBaseVersion < serverVersion;
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
