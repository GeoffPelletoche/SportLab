import { HttpError } from './http.js';

export async function bootstrapUser(env, displayName, tokenHash) {
  const existing = await env.DB.prepare('SELECT COUNT(*) AS count FROM users').first();
  if (Number(existing?.count || 0) > 0) throw new HttpError(409, 'already_bootstrapped', 'Un utilisateur existe déjà.');
  const now = Date.now();
  const id = crypto.randomUUID();
  await env.DB.prepare(
    'INSERT INTO users (id, display_name, token_hash, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?4)'
  ).bind(id, displayName, tokenHash, now).run();
  return { id, displayName, createdAt: now };
}

export async function registerDevice(env, userId, input) {
  const now = Date.now();
  const id = input.id || crypto.randomUUID();
  await env.DB.prepare(`
    INSERT INTO devices (id, user_id, name, platform, last_seen_at, created_at)
    VALUES (?1, ?2, ?3, ?4, ?5, ?5)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      platform = excluded.platform,
      last_seen_at = excluded.last_seen_at,
      revoked_at = NULL
    WHERE devices.user_id = excluded.user_id
  `).bind(id, userId, input.name, input.platform || null, now).run();
  return { id, name: input.name, platform: input.platform || null, lastSeenAt: now };
}

export async function assertDevice(env, userId, deviceId) {
  const device = await env.DB.prepare(
    'SELECT id FROM devices WHERE id = ?1 AND user_id = ?2 AND revoked_at IS NULL'
  ).bind(deviceId, userId).first();
  if (!device) throw new HttpError(403, 'invalid_device', 'Appareil inconnu ou révoqué.');
  await env.DB.prepare('UPDATE devices SET last_seen_at = ?1 WHERE id = ?2').bind(Date.now(), deviceId).run();
}

export async function pushChanges(env, userId, deviceId, changes) {
  const accepted = [];
  const conflicts = [];
  for (const change of changes) {
    const current = await env.DB.prepare(`
      SELECT version, client_updated_at, server_updated_at, payload, deleted, device_id
      FROM sync_records WHERE user_id = ?1 AND namespace = ?2 AND record_key = ?3
    `).bind(userId, change.namespace, change.key).first();
    const expectedVersion = Number(change.baseVersion || 0);
    if (current && expectedVersion !== Number(current.version)) {
      conflicts.push({ namespace: change.namespace, key: change.key, current });
      continue;
    }
    const now = Date.now();
    const nextVersion = current ? Number(current.version) + 1 : 1;
    const payload = change.deleted ? null : JSON.stringify(change.payload ?? null);
    await env.DB.batch([
      env.DB.prepare(`
        INSERT INTO sync_records
          (user_id, namespace, record_key, payload, deleted, version, client_updated_at, server_updated_at, device_id)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
        ON CONFLICT(user_id, namespace, record_key) DO UPDATE SET
          payload = excluded.payload,
          deleted = excluded.deleted,
          version = excluded.version,
          client_updated_at = excluded.client_updated_at,
          server_updated_at = excluded.server_updated_at,
          device_id = excluded.device_id
      `).bind(userId, change.namespace, change.key, payload, change.deleted ? 1 : 0, nextVersion, change.clientUpdatedAt, now, deviceId),
      env.DB.prepare(`
        INSERT INTO change_log
          (user_id, namespace, record_key, version, deleted, server_updated_at, device_id)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
      `).bind(userId, change.namespace, change.key, nextVersion, change.deleted ? 1 : 0, now, deviceId)
    ]);
    accepted.push({ namespace: change.namespace, key: change.key, version: nextVersion, serverUpdatedAt: now });
  }
  return { accepted, conflicts };
}

export async function pullChanges(env, userId, cursor, limit) {
  const rows = await env.DB.prepare(`
    SELECT c.sequence, c.namespace, c.record_key, c.version, c.deleted, c.server_updated_at, c.device_id,
           r.payload, r.client_updated_at
    FROM change_log c
    LEFT JOIN sync_records r
      ON r.user_id = c.user_id AND r.namespace = c.namespace AND r.record_key = c.record_key
    WHERE c.user_id = ?1 AND c.sequence > ?2
    ORDER BY c.sequence ASC
    LIMIT ?3
  `).bind(userId, cursor, limit).all();
  const changes = (rows.results || []).map(row => ({
    cursor: Number(row.sequence), namespace: row.namespace, key: row.record_key,
    version: Number(row.version), deleted: Boolean(row.deleted),
    payload: row.payload === null ? null : JSON.parse(row.payload),
    clientUpdatedAt: Number(row.client_updated_at || 0), serverUpdatedAt: Number(row.server_updated_at),
    deviceId: row.device_id
  }));
  return { changes, cursor: changes.at(-1)?.cursor ?? cursor, hasMore: changes.length === limit };
}

export async function getSnapshot(env, userId) {
  const rows = await env.DB.prepare(`
    SELECT namespace, record_key, payload, deleted, version, client_updated_at, server_updated_at, device_id
    FROM sync_records WHERE user_id = ?1 ORDER BY namespace, record_key
  `).bind(userId).all();
  return (rows.results || []).map(row => ({
    namespace: row.namespace, key: row.record_key,
    payload: row.payload === null ? null : JSON.parse(row.payload),
    deleted: Boolean(row.deleted), version: Number(row.version),
    clientUpdatedAt: Number(row.client_updated_at), serverUpdatedAt: Number(row.server_updated_at),
    deviceId: row.device_id
  }));
}
