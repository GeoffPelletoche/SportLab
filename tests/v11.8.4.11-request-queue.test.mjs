import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createRequestReuseCache } from '../core/api/requestReuseCache.js';

test('successful fixture reuse expires, is bounded and cannot be mutated by a caller', () => {
  let now = 0;
  const cache = createRequestReuseCache({ now: () => now, maxEntries: 2 });
  cache.write('a', { response: [{ id: 1 }] });
  const copy = cache.read('a'); copy.value.response[0].id = 99;
  assert.equal(cache.read('a').value.response[0].id, 1);
  now = 60000; assert.equal(cache.read('a'), null);
  cache.write('a', {}); cache.write('b', {}); cache.write('c', {});
  assert.equal(cache.read('a'), null);
});

test('a failed in-flight request can be retried after its reservation is released', async () => {
  const cache = createRequestReuseCache();
  await assert.rejects(cache.run('a', () => { throw new Error('offline'); }));
  assert.deepEqual(await cache.run('a', () => ({ success: true })), { success: true });
});

test('real API client/scheduler share requests, reuse recent fixtures and respect every 429 deadline', () => {
  const result = spawnSync(process.execPath, ['--experimental-vm-modules', new URL('./requestQueueRuntimeHarness.mjs', import.meta.url).pathname], { encoding: 'utf8', timeout: 10000 });
  assert.equal(result.status, 0, result.stderr + result.stdout);
});
