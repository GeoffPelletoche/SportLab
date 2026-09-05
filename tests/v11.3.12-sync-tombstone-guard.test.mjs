import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const engine = fs.readFileSync(new URL('../core/sync/syncEngine.js', import.meta.url), 'utf8');
const adapter = fs.readFileSync(new URL('../core/sync/localDataAdapter.js', import.meta.url), 'utf8');
const resolverSource = fs.readFileSync(new URL('../core/sync/conflictResolver.js', import.meta.url), 'utf8');

function storageMock(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: key => data.has(key) ? data.get(key) : null,
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: key => data.delete(key),
    dump: () => Object.fromEntries(data)
  };
}

test('V11.3.12 purges stale queued tombstones from previous clients', async () => {
  globalThis.localStorage = storageMock({
    'sportlab.v7.cloud.queue.v2': JSON.stringify([
      { namespace: 'analyses', key: 'sportlab_analyses_v1', deleted: true, payload: null },
      { namespace: 'learning', key: 'sportlab_learning_v1', deleted: false, payload: { raw: '[]' } }
    ])
  });
  const { queueManager } = await import(`../core/sync/queueManager.js?purge=${Date.now()}`);
  assert.equal(queueManager.purgeUnsafeTombstones(), 1);
  const items = queueManager.list();
  assert.equal(items.length, 1);
  assert.equal(items[0].key, 'sportlab_learning_v1');
  assert.equal(items[0].deleted, false);
});

test('V11.3.12 refuses implicit deletes but keeps a future explicit-delete path', async () => {
  globalThis.localStorage = storageMock();
  const { queueManager } = await import(`../core/sync/queueManager.js?enqueue=${Date.now()}`);
  queueManager.enqueue([{ namespace: 'bets', key: 'sportlab_bets_v3', deleted: true, payload: null }]);
  assert.equal(queueManager.size(), 0);
  queueManager.enqueue([{ namespace: 'bets', key: 'sportlab_bets_v3', deleted: true, payload: null, deleteIntent: queueManager.explicitDeleteIntent }]);
  assert.equal(queueManager.size(), 1);
});

test('V11.3.12 automatic local scan can only emit deleted=false', () => {
  assert.match(adapter, /deleted: false/);
  assert.doesNotMatch(adapter, /deleted: raw === null/);
});

test('V11.3.12 purges queue before startup/manual capture', () => {
  const purgePos = engine.indexOf('queueManager.purgeUnsafeTombstones()');
  const capturePos = engine.indexOf('captureChanges({ force: reason === "startup" || reason === "manual" })');
  assert.ok(purgePos >= 0 && capturePos > purgePos);
});

test('V11.3.12 server tombstones are authoritative on every conflict', async () => {
  const { resolveConflicts } = await import(`../core/sync/conflictResolver.js?resolver=${Date.now()}`);
  assert.match(resolverSource, /const authoritativeServerDelete = Boolean\(server\.deleted\)/);
  const result = resolveConflicts([{
    server: { namespace: 'analyses', key: 'sportlab_analyses_v1', deleted: true, version: 1, serverUpdatedAt: 1 },
    client: { namespace: 'analyses', key: 'sportlab_analyses_v1', deleted: false, baseVersion: 99, clientUpdatedAt: 999999, payload: { raw: '[1]' } }
  }]);
  assert.equal(result.recordsToApply.length, 1);
  assert.equal(result.localToRetry.length, 0);
  assert.equal(result.decisions[0].winner, 'server');
});
