import vm from 'node:vm';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const root = new URL('../', import.meta.url);
async function environment(fetchImpl, snapshotBuild = false, localStorage = undefined, competitionCount = 1) {
  let time = Date.parse('2026-10-08T14:00:00Z');
  let sequence = 0;
  const timers = new Map();
  const ClockDate = class extends Date { constructor(...args) { super(...(args.length ? args : [time])); } static now() { return time; } };
  const context = vm.createContext({ console, URL, AbortController, Response, localStorage, Date: ClockDate, performance: { now: () => time }, process: { env: { SPORTLAB_SNAPSHOT_BUILD: snapshotBuild ? '1' : '' } },
    setTimeout(fn, ms) { const id = ++sequence; timers.set(id, { at: time + ms, fn }); return id; }, clearTimeout(id) { timers.delete(id); }, fetch: (...args) => fetchImpl(time, ...args) });
  const modules = new Map();
  async function load(url) {
    const id = url.href;
    if (modules.has(id)) return modules.get(id);
    let module;
    if (url.pathname.endsWith('/config/config.js')) module = new vm.SyntheticModule(['CONFIG'], function() { this.setExport('CONFIG', { api: { workerBaseUrl: 'https://worker.example' }, analysisWindowDays: 1, drawhunter: { competitions: Array.from({ length: competitionCount }, (_, i) => ({ id: 61 + i, name: 'Football ' + i, active: true })) }, frenchflair: { competitions: Array.from({ length: competitionCount }, (_, i) => ({ id: 16 + i, name: 'Rugby ' + i, active: true })) }, nfl: { leagueId: 1 } }); }, { context });
    else module = new vm.SourceTextModule(fs.readFileSync(fileURLToPath(url), 'utf8'), { context, identifier: id });
    modules.set(id, module);
    await module.link((specifier, referencing) => load(new URL(specifier, referencing.identifier)));
    return module;
  }
  const client = await load(new URL('core/api/apiClient.js', root));
  await client.evaluate();
  const scheduler = modules.get(new URL('core/api/requestScheduler.js', root).href).namespace;
  const diagnostics = modules.get(new URL('core/diagnostics/performanceInstrumentation.js', root).href).namespace;
  async function settle(promise) {
    let result, failure, done = false;
    promise.then(value => { result = value; done = true; }, error => { failure = error; done = true; });
    for (let i = 0; !done && i < 100; i++) {
      await new Promise(resolve => setImmediate(resolve));
      if (done) break;
      const next = [...timers.entries()].sort((a, b) => a[1].at - b[1].at)[0];
      assert.ok(next, 'promise pending without a timer');
      timers.delete(next[0]); time = next[1].at; next[1].fn();
    }
    assert.ok(done, 'promise did not finish');
    if (failure) throw failure;
    return result;
  }
  return { client: client.namespace, scheduler, diagnostics, settle,
    async loadService(name) { const module = await load(new URL(`core/api/${name}.js`, root)); await module.evaluate(); return module.namespace; }, advance: ms => { time += ms; }, now: () => time };
}
const ok = () => new Response(JSON.stringify({ response: [{ id: 1 }], source: 'worker' }), { status: 200 });
{
  let calls = 0;
  const env = await environment(() => { calls++; return ok(); });
  const [a, b] = await env.settle(Promise.all([
    env.client.fetchFromWorker('/football/fixtures', { league: 61, from: 'today' }),
    env.client.fetchFromWorker('/football/fixtures', { from: 'today', league: 61 })
  ]));
  assert.equal(calls, 1);
  a.response[0].id = 99;
  assert.equal(b.response[0].id, 1);
  const cached = await env.settle(env.client.fetchFromWorker('/football/fixtures', { league: 61, from: 'today' }));
  assert.equal(calls, 1);
  assert.equal(cached.clientCacheHit, true);
  assert.equal(cached.clientVerifiedAt, a.clientVerifiedAt);
  assert.equal(cached.response[0].id, 1);
  const bypass = await env.settle(env.client.fetchFromWorker('/football/fixtures', { league: 61, from: 'today' }, { forceFresh: true }));
  assert.equal(calls, 2);
  assert.equal(bypass.clientCacheHit, undefined);
  env.advance(60000);
  await env.settle(env.client.fetchFromWorker('/football/fixtures', { league: 61, from: 'today' }));
  assert.equal(calls, 3);
  const reuse = env.diagnostics.getPerformanceReport().requestReuse;
  assert.equal(reuse.recent, 1);
  assert.equal(reuse.inFlight, 1);
}
{
  let calls = 0;
  const starts = [];
  const env = await environment(time => {
    starts.push(time);
    if (++calls === 1) return new Response(JSON.stringify({ code: 'API_SPORTS_RATE_LIMIT', retryAfterMs: 1500 }), { status: 429, headers: { 'Retry-After': '120' } });
    return ok();
  });
  await assert.rejects(env.settle(env.client.fetchFromWorker('/football/fixtures', { league: 39 }, { attempts: 1, rateLimitRetries: 0 })), error => error.status === 429);
  await assert.rejects(env.settle(env.client.fetchFromWorker('/football/fixtures', { league: 39 })), e => e.deferred);
  env.advance(120000);
  await env.settle(env.client.fetchFromWorker('/football/fixtures', { league: 39 }));
  assert.equal(calls, 2); // failure never cached; even no-retry caller blocks subsequent traffic
  assert.ok(starts[1] - starts[0] >= 120000);
  assert.equal(env.diagnostics.getPerformanceReport().scheduler.rateLimits, 1);
}
{
  let calls = 0;
  const starts = [];
  const env = await environment(time => {
    starts.push(time);
    if (++calls === 1) return new Response(JSON.stringify({ code: 'API_SPORTS_RATE_LIMIT' }), { status: 429, headers: { 'Retry-After': new Date(time + 30000).toUTCString() } });
    return ok();
  });
  await env.settle(env.client.fetchFromWorker('/nfl/games', {}, { rateLimitRetries: 1, maxQueueWaitMs: 90000 }));
  assert.equal(calls, 2);
  assert.ok(starts[1] - starts[0] >= 30000);
  assert.equal(env.diagnostics.getPerformanceReport().scheduler.rateLimits, 1);
}
{
  const env = await environment(() => ok());
  await env.settle(env.scheduler.scheduleApiRequest(() => 'first'));
  const task = env.scheduler.scheduleApiRequest(() => env.now());
  await new Promise(resolve => setImmediate(resolve)); // queue is now waiting for the 900ms gap
  env.scheduler.applyGlobalRateLimit(30000);
  const deadline = env.scheduler.getApiSchedulerState().blockedUntil;
  const started = await env.settle(task);
  assert.ok(started >= deadline, 'queue must recheck a deadline extended during its wait');
}
{
  let calls = 0;
  const env = await environment(() => { calls++; return ok(); }, true);
  await env.settle(env.client.fetchFromWorker('/football/fixtures', { league: 61 }));
  await env.settle(env.client.fetchFromWorker('/football/fixtures', { league: 61 }));
  assert.equal(calls, 2); // scheduled server snapshot builds always fetch their fixtures
}
{
  const env = await environment(() => ok());
  assert.equal(env.scheduler.applyGlobalRateLimit(0), 15000);
  assert.equal(env.scheduler.applyGlobalRateLimit(0), 30000);
  assert.equal(env.scheduler.applyGlobalRateLimit(0), 60000);
  assert.equal(env.scheduler.applyGlobalRateLimit(0), 60000);
  assert.equal(env.scheduler.applyGlobalRateLimit(120000), 120000);
}
{
  let calls = 0;
  const env = await environment(() => { calls++; return new Response(JSON.stringify({ response: [] }), { status: 200 }); });
  for (const [file, method] of [['footballService', 'fetchUpcomingFootballFixtures'], ['rugbyService', 'fetchUpcomingRugbyFixtures'], ['nflService', 'fetchUpcomingNflFixtures']]) {
    const service = await env.loadService(file);
    const data = { matches: [], meta: { syncedAt: new Date(env.now() - 240000).toISOString() } };
    const count = calls;
    const reused = await env.settle(service[method]({ previousPayload: data, previousMatches: [], refreshMode: 'manual' }));
    assert.equal(calls, count);
    assert.equal(reused.meta.fixtureRefreshPolicy.reason, 'recently-verified-snapshot');
    await env.settle(service[method]({ previousPayload: data, previousMatches: [], refreshMode: 'force' }));
    await env.settle(service[method]({ previousPayload: data, previousMatches: [], refreshMode: 'force' }));
    assert.equal(calls, count + 2, 'force bypasses both the persistent snapshot and the one-minute response cache');
  }
}
console.log('Request queue integration passed');

// Two refusals separated by a success still open the circuit; no hidden retries.
{
  let calls = 0;
  const env = await environment(() => {
    calls++;
    return calls === 2 ? ok() : new Response(JSON.stringify({ code: 'API_SPORTS_RATE_LIMIT' }), { status: 429 });
  });
  await assert.rejects(env.settle(env.client.fetchFromWorker('/nfl/games', { id: 1 })), e => e.status === 429);
  await env.settle(env.client.fetchFromWorker('/nfl/games', { id: 2 }));
  const denied = env.client.fetchFromWorker('/nfl/games', { id: 3 });
  const waiting = env.client.fetchFromWorker('/nfl/team-games', { team: 4 });
  const results = await env.settle(Promise.allSettled([denied, waiting]));
  assert.equal(calls, 3);
  assert.equal(results[0].reason.status, 429);
  assert.equal(results[1].reason.code, 'API_QUEUE_CIRCUIT_OPEN');
  await assert.rejects(env.settle(env.client.fetchFromWorker('/nfl/games', { id: 5 })), e => e.deferred === true);
  assert.equal(calls, 3);
  env.advance(120000);
  await assert.rejects(env.settle(env.client.fetchFromWorker('/nfl/games', { id: 6 })), e => e.status === 429);
  assert.equal(calls, 4, 'circuit releases after the deadline');
}
// A long provider deadline expires queued work without sending it or retrying it.
{
  let calls = 0;
  const env = await environment(() => { calls++; return new Response(JSON.stringify({ code: 'API_SPORTS_RATE_LIMIT', retryAfterMs: 60000 }), { status: 429 }); });
  env.scheduler.applyGlobalRateLimit(0);
  await assert.rejects(env.settle(env.client.fetchFromWorker('/rugby/fixtures', {}, { maxQueueWaitMs: 5000 })), e => e.code === 'API_QUEUE_WAIT_EXPIRED');
  assert.equal(calls, 0);
  assert.equal(env.scheduler.getApiSchedulerState().queued, 0);
  assert.equal(env.diagnostics.getPerformanceReport().scheduler.deferred, 1);
}
// A Worker cooldown flushes other queued work, without counting a new upstream 429.
{
  let calls = 0;
  const env = await environment(() => { calls++; return new Response(JSON.stringify({ code: 'API_SPORTS_COOLDOWN', retryAfterMs: 90000, apiDiagnostics: { bridgeVersion: '3.11.1', quotas: [] } }), { status: 503 }); });
  const results = await env.settle(Promise.allSettled([
    env.client.fetchFromWorker('/nfl/games', {}), env.client.fetchFromWorker('/nfl/team-games', {})
  ]));
  assert.equal(results.every(r => r.status === 'rejected' && r.reason.deferred), true);
  assert.equal(calls, 1);
  assert.equal(env.diagnostics.getPerformanceReport().scheduler.rateLimits, 0);
  assert.equal(env.diagnostics.getPerformanceReport().bridgeDiagnostics[0].bridgeVersion, '3.11.1');
}
// Real services mark partial sweeps as failed, never as a complete verified refresh.
{
  const env = await environment(() => new Response(JSON.stringify({ code: 'API_SPORTS_COOLDOWN', retryAfterMs: 90000 }), { status: 503 }));
  for (const [name, method] of [['rugbyService', 'fetchUpcomingRugbyFixtures'], ['footballService', 'fetchUpcomingFootballFixtures']]) {
    const service = await env.loadService(name);
    const result = await env.settle(service[method]({ refreshMode: 'force' }));
    assert.equal(result.meta.error, true);
    assert.equal(result.meta.refreshDeferred, true);
  }
}

// The persisted pause survives reopening, and expires without extending itself.
{
  const values = new Map();
  const storage = { getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, value) };
  const first = await environment(() => ok(), false, storage);
  first.scheduler.applyApiCooldown(120000);
  let calls = 0;
  const reopened = await environment(() => { calls++; return ok(); }, false, storage);
  await assert.rejects(reopened.settle(reopened.client.fetchFromWorker('/nfl/games', {})), e => e.deferred);
  assert.equal(calls, 0);
  reopened.advance(120000);
  await reopened.settle(reopened.client.fetchFromWorker('/nfl/games', {}));
  assert.equal(calls, 1);
}

// Integration: stop rugby histories after the refusal, let football complete.
{
  const paths = [];
  const fixture = (id, leagueId) => ({ id, leagueId, homeId: id * 2, awayId: id * 2 + 1, home: 'Home', away: 'Away', date: '2026-10-09T20:00:00Z', season: 2026 });
  const env = await environment((time, url) => {
    const parsed = new URL(url); const path = parsed.pathname; paths.push(path); const league = Number(parsed.searchParams.get('league'));
    if (path === '/rugby/team-games') return new Response(JSON.stringify({ code: 'API_SPORTS_RATE_LIMIT', retryAfterMs: 60000 }), { status: 429 });
    const response = path === '/rugby/fixtures' ? Array.from({ length: 10 }, (_, i) => fixture(10000 + league * 100 + i, league))
      : path === '/football/fixtures' ? [fixture(500 + league, league)] : [{ id: 1000 }];
    return new Response(JSON.stringify({ response, season: 2026 }), { status: 200 });
  }, false, undefined, 3);
  const rugby = await env.loadService('rugbyService');
  const football = await env.loadService('footballService');
  const [r, f] = await env.settle(Promise.all([rugby.fetchUpcomingRugbyFixtures({ refreshMode: 'force' }), football.fetchUpcomingFootballFixtures({ refreshMode: 'force' })]));
  assert.equal(paths.filter(p => p === '/rugby/team-games').length, 1);
  assert.ok(r.meta.historyDiagnostics.requested <= 3, 'at most the already active rugby workers submitted calls');
  assert.ok(r.meta.historyDiagnostics.skipped >= 17);
  assert.equal(r.meta.historyDiagnostics.stopped, true);
  assert.equal(r.meta.error, true);
  assert.equal(f.meta.error, undefined);
  assert.equal(paths.filter(p => p === '/football/team-fixtures').length, 6);
  assert.equal(f.fixtures[0].homeHistory.length, 1);
  assert.equal(f.fixtures[0].awayHistory.length, 1);
  assert.equal(env.scheduler.getApiSchedulerState().queued, 0);
  await env.settle(env.client.fetchFromWorker('/nfl/games', {}));
  assert.equal(paths.at(-1), '/nfl/games');
}
// A scoped pause persists across reopening without blocking another sport.
{
  const values = new Map();
  const storage = { getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, value) };
  const first = await environment(() => ok(), false, storage);
  first.scheduler.applyApiCooldown(60000, { path: '/rugby/team-games' });
  let calls = 0;
  const reopened = await environment(() => { calls++; return ok(); }, false, storage);
  await assert.rejects(reopened.settle(reopened.client.fetchFromWorker('/rugby/fixtures', {})), e => e.deferred);
  await reopened.settle(reopened.client.fetchFromWorker('/football/fixtures', {}));
  assert.equal(calls, 1);
  reopened.advance(60000);
  await reopened.settle(reopened.client.fetchFromWorker('/rugby/fixtures', {}));
  assert.equal(calls, 2);
}
// A low-priority eligible sport wakes the drain during a high-priority sport pause.
{
  const env = await environment(() => ok());
  env.scheduler.applyGlobalRateLimit(0, { path: '/rugby/fixtures' });
  const rugby = env.scheduler.scheduleApiRequest(() => 'rugby', { path: '/rugby/fixtures', priority: 110 });
  await new Promise(resolve => setImmediate(resolve));
  const before = env.now();
  const football = env.scheduler.scheduleApiRequest(() => 'football', { path: '/football/team-fixtures' });
  assert.equal(await env.settle(football), 'football');
  assert.ok(env.now() - before < 15000, 'football never waits for the rugby cooldown');
  assert.equal(await env.settle(rugby), 'rugby');
}
