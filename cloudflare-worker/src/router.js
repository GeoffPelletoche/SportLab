import { authenticate, createToken, hashToken, requireSecret } from './auth.js';
import { assertDevice, bootstrapUser, getSnapshot, pullChanges, pushChanges, registerDevice } from './db.js';
import { assertString, HttpError, json, readJson } from './http.js';

function validateChange(value) {
  if (!value || typeof value !== 'object') throw new HttpError(400, 'invalid_change', 'Modification invalide.');
  const namespace = assertString(value.namespace, 'namespace', { max: 80 });
  const key = assertString(value.key, 'key', { max: 240 });
  const clientUpdatedAt = Number(value.clientUpdatedAt);
  if (!Number.isSafeInteger(clientUpdatedAt) || clientUpdatedAt <= 0) throw new HttpError(400, 'invalid_change', 'clientUpdatedAt invalide.');
  return { namespace, key, payload: value.payload, deleted: Boolean(value.deleted), clientUpdatedAt, baseVersion: Number(value.baseVersion || 0) };
}

export async function route(request, env) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '') || '/';

  if (request.method === 'GET' && path === '/health') {
    return json({ ok: true, service: 'sportlab-cloud-sync', version: '7.0.2', environment: env.APP_ENV || 'unknown', time: Date.now() });
  }

  if (request.method === 'POST' && path === '/v1/auth/bootstrap') {
    requireSecret(request.headers.get('x-setup-secret'), env.SETUP_SECRET, 'Secret d’installation');
    if (!env.TOKEN_PEPPER) throw new HttpError(500, 'server_misconfigured', 'TOKEN_PEPPER absent.');
    const body = await readJson(request, 20_000);
    const displayName = assertString(body.displayName, 'displayName', { max: 100 });
    const token = createToken();
    const user = await bootstrapUser(env, displayName, await hashToken(token, env.TOKEN_PEPPER));
    return json({ user, token, warning: 'Ce jeton ne sera plus affiché. Conservez-le dans un gestionnaire sécurisé.' }, 201);
  }

  const user = await authenticate(request, env);

  if (request.method === 'GET' && path === '/v1/me') return json({ user });

  if (request.method === 'POST' && path === '/v1/devices') {
    const body = await readJson(request, 30_000);
    const device = await registerDevice(env, user.id, {
      id: body.id ? assertString(body.id, 'id', { max: 100 }) : undefined,
      name: assertString(body.name, 'name', { max: 100 }),
      platform: body.platform ? assertString(body.platform, 'platform', { max: 80 }) : null
    });
    return json({ device }, 201);
  }

  if (request.method === 'POST' && path === '/v1/sync/push') {
    const body = await readJson(request);
    const deviceId = assertString(body.deviceId, 'deviceId', { max: 100 });
    await assertDevice(env, user.id, deviceId);
    if (!Array.isArray(body.changes) || body.changes.length > 250) throw new HttpError(400, 'invalid_changes', 'changes doit contenir au maximum 250 éléments.');
    const result = await pushChanges(env, user.id, deviceId, body.changes.map(validateChange));
    return json(result, result.conflicts.length ? 409 : 200);
  }

  if (request.method === 'GET' && path === '/v1/sync/pull') {
    const cursor = Math.max(0, Number.parseInt(url.searchParams.get('cursor') || '0', 10) || 0);
    const limit = Math.min(500, Math.max(1, Number.parseInt(url.searchParams.get('limit') || '200', 10) || 200));
    return json(await pullChanges(env, user.id, cursor, limit));
  }

  if (request.method === 'GET' && path === '/v1/sync/snapshot') return json({ records: await getSnapshot(env, user.id) });

  if (request.method === 'GET' && path === '/v1/backup') {
    return json({ version: '7.0.2', exportedAt: Date.now(), records: await getSnapshot(env, user.id) });
  }

  if (request.method === 'POST' && path === '/v1/restore') {
    const body = await readJson(request);
    if (!Array.isArray(body.records) || body.records.length > 5000) throw new HttpError(400, 'invalid_records', 'records doit contenir au maximum 5000 éléments.');
    const deviceId = assertString(body.deviceId || (await registerDevice(env, user.id, { name: 'Restore', platform: 'backend' })).id, 'deviceId', { max: 100 });
    await assertDevice(env, user.id, deviceId);
    const changes = body.records.map(record => validateChange({ ...record, clientUpdatedAt: Number(record.clientUpdatedAt || Date.now()) }));
    return json(await pushChanges(env, user.id, deviceId, changes), 200);
  }


  throw new HttpError(404, 'not_found', 'Route inconnue.');
}
