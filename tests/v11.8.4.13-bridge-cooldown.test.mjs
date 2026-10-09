import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { completeRefreshMeta } from '../core/api/refreshCompletion.js';

function bridge(fetchImpl) {
  let time = Date.parse('2026-10-09T04:26:00Z');
  const ClockDate = class extends Date { constructor(...args) { super(...(args.length ? args : [time])); } static now() { return time; } };
  const context = vm.createContext({ URL, Response, Date: ClockDate, console,
    setTimeout(fn, ms) { time += ms; queueMicrotask(fn); }, fetch: fetchImpl });
  const source = fs.readFileSync(new URL('../cloudflare-worker/sportlab-api-bridge-v3.11.1.js', import.meta.url), 'utf8');
  vm.runInContext(source.replace('export default', 'const worker ='), context);
  return { fetch: url => context.fetchApiSports(url, { API_SPORTS_KEY: 'test-only' }),
    response: data => context.corsResponse(data), advance: ms => { time += ms; } };
}

test('Bridge refuses further calls on the affected host, preserves quotas and releases after cooldown', async () => {
  let calls = 0;
  const worker = bridge(async () => {
    calls++;
    return calls === 1 ? new Response(JSON.stringify({ errors: { rateLimit: 'too many requests' } }), {
      status: 200, headers: { 'x-ratelimit-limit': '10', 'x-ratelimit-remaining': '0', 'x-ratelimit-requests-remaining': '84' }
    }) : new Response(JSON.stringify({ response: [] }), { status: 200 });
  });
  const nfl = 'https://v1.american-football.api-sports.io/games';
  await assert.rejects(worker.fetch(nfl), e => e.status === 429 && e.retryAfterMs === 60000);
  await assert.rejects(worker.fetch(nfl), e => e.code === 'API_SPORTS_COOLDOWN');
  assert.equal(calls, 1);
  await worker.fetch('https://v1.rugby.api-sports.io/games');
  assert.equal(calls, 2, 'other host is independently protected');
  const payload = await worker.response({ response: [] }).json();
  assert.equal(payload.apiDiagnostics.bridgeVersion, '3.11.1');
  assert.equal(payload.apiDiagnostics.scope, 'worker-instance');
  assert.equal(payload.apiDiagnostics.quotas[0].minuteRemaining, 0);
  assert.equal(payload.apiDiagnostics.quotas[0].dailyRemaining, 84);
  assert.equal(payload.apiDiagnostics.quotas[0].dailyLimit, null);
  assert.equal(JSON.stringify(payload).includes('test-only'), false);
  worker.advance(60000);
  await worker.fetch(nfl);
  assert.equal(calls, 3);
});

test('malformed HTTP 429 and HTTP-date Retry-After still protect upstream', async () => {
  let calls = 0;
  const worker = bridge(async () => { calls++; return new Response('invalid', { status: 429, headers: { 'Retry-After': 'Fri, 09 Oct 2026 04:29:00 GMT' } }); });
  await assert.rejects(worker.fetch('https://v3.football.api-sports.io/fixtures'), e => e.status === 429 && e.retryAfterMs >= 180000);
  await assert.rejects(worker.fetch('https://v3.football.api-sports.io/fixtures'), e => e.code === 'API_SPORTS_COOLDOWN');
  assert.equal(calls, 1);
  assert.equal(worker.response({ retryAfterMs: 180000 }, 503).headers.get('Retry-After'), '180');
});

test('incomplete fixtures or failed histories cannot be declared a successful snapshot', () => {
  const complete = { syncLog: [{ status: 'EMPTY' }], historyDiagnostics: { errors: 0 } };
  assert.equal(completeRefreshMeta(complete), complete);
  assert.equal(completeRefreshMeta({ syncLog: [{ status: 'ERROR' }] }).error, true);
  assert.equal(completeRefreshMeta({ syncLog: [{ status: 'OK' }], historyDiagnostics: { errors: 1 } }).refreshDeferred, true);
});
