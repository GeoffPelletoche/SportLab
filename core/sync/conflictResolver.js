function timestamp(record) {
  return Number(record?.clientUpdatedAt || record?.client_updated_at || record?.serverUpdatedAt || record?.server_updated_at || 0);
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
    const serverWins = !local || timestamp(server) >= timestamp(local);
    if (serverWins) recordsToApply.push(server);
    else localToRetry.push({ ...local, baseVersion: Number(server.version || 0) });
    decisions.push({ namespace, key, winner: serverWins ? "server" : "client", serverTimestamp: timestamp(server), clientTimestamp: timestamp(local) });
  }

  return { recordsToApply, localToRetry, decisions };
}
