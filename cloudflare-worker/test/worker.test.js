import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.js';

test('GET /health exposes version and no-store', async () => {
  const response = await worker.fetch(new Request('https://worker.test/health'), { APP_ENV: 'test', ALLOWED_ORIGINS: '' });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.version, '7.1.3');
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

test('D1 quota error is surfaced with a stable application code', async () => {
  const response = await worker.fetch(new Request('https://worker.test/v1/me', {
    headers: { authorization: 'Bearer test-token' }
  }), {
    APP_ENV: 'test',
    ALLOWED_ORIGINS: '',
    TOKEN_PEPPER: 'test-pepper',
    DB: {
      prepare() {
        return {
          bind() {
            return {
              first: async () => {
                throw new Error("D1_ERROR: Your account has exceeded D1's free tier daily row read limit. Upgrade to a paid plan or wait until tomorrow (midnight UTC) to continue.");
              }
            };
          }
        };
      }
    }
  });
  assert.equal(response.status, 429);
  const body = await response.json();
  assert.equal(body.error.code, 'd1_daily_quota_exceeded');
});
