import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.js';

test('GET /health exposes version and no-store', async () => {
  const response = await worker.fetch(new Request('https://worker.test/health'), { APP_ENV: 'test', ALLOWED_ORIGINS: '' });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.version, '7.0.1');
});

test('OPTIONS returns CORS headers for an allowed origin', async () => {
  const response = await worker.fetch(new Request('https://worker.test/v1/me', { method: 'OPTIONS', headers: { origin: 'https://example.github.io' } }), { ALLOWED_ORIGINS: 'https://example.github.io' });
  assert.equal(response.status, 204);
  assert.equal(response.headers.get('access-control-allow-origin'), 'https://example.github.io');
});

test('unknown origin is rejected', async () => {
  const response = await worker.fetch(new Request('https://worker.test/health', { headers: { origin: 'https://evil.example' } }), { APP_ENV: 'test', ALLOWED_ORIGINS: 'https://example.github.io' });
  assert.equal(response.status, 403);
});
