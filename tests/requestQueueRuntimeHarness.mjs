import vm from 'node:vm';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const root = new URL('../', import.meta.url);
async function environment(fetchImpl, snapshotBuild = false) {
  let time = Date.parse('2026-10-08T14:00:00Z');
  let sequence = 0;
  const timers = new Map();
  const ClockDate = class extends Date { constructor(...args) { super(...(args.length ? args : [time])); } static now() { return time; } };
  const context = vm.createContext({ console, URL, AbortController, Response, Date: ClockDate, performance: { now: () => time }, process: { env: { SPORTLAB_SNAPSHOT_BUILD: snapshotBuild ? '1' : '' } },
    setTimeout(fn, ms) { const id = ++sequence; timers.set(id, { at: time + ms, fn }); return id; }, clearTimeout(id) { timers.delete(id); }, fetch: (...args) => fetchImpl(time, ...args) });
  const modules = new Map();
  async function load(url) {
    const id = url.href;
    if (modules.has(id)) return modules.get(id);
    let module;
    if (url.pathname.endsWith('/config/config.js')) module = new vm.SyntheticModule(['CONFIG'], function() { this.setExport('CONFIG', { api: { workerBaseUrl: 'https://worker.example' } }); }, { context });
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
  return { client: client.namespace, scheduler, diagnostics, settle, advance: ms => { time += ms; }, now: () => time };
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
  await env.settle(env.client.fetchFromWorker('/football/fixtures', { league: 39 }, { attempts: 1, rateLimitRetries: 0 }));
  assert.equal(calls, 2); // failure never cached; even no-retry caller blocks subsequent traffic
  assert.ok(starts[1] - starts[0] >= 120000);
  assert.equal(env.diagnostics.getPerformanceReport().scheduler.rateLimits, 1);
}
{
  let calls = 0;
  const starts = [];
  const env = await environment(time => {
    starts.push(time);
    if (++calls === 1) return new Response(JSON.stringify({ code: 'API_SPORTS_RATE_LIMIT' }), { status: 429, headers: { 'Retry-After': new Date(time + 45000).toUTCString() } });
    return ok();
  });
  await env.settle(env.client.fetchFromWorker('/nfl/games', {}));
  assert.equal(calls, 2);
  assert.ok(starts[1] - starts[0] >= 45000);
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
console.log('Request queue integration passed');
