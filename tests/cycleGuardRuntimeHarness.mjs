import vm from 'node:vm';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const root = new URL('../', import.meta.url);
const source = fs.readFileSync(new URL('legacyApp.js', root), 'utf8');
const payload = count => ({ matches: Array.from({ length: count }, (_, i) => ({ id: i + 1, homeHistory: [{}], awayHistory: [{}] })), meta: { loading: false, syncedAt: new Date(Date.now() - 64 * 60000).toISOString(), phase: 'complete' } });
const sizes = { drawhunter: 8, frenchflair: 12, nfl: 1 };
const events = [];
const renders = [];
const pending = new Map();
const calls = { drawhunter: 0, frenchflair: 0, nfl: 0 };
const capital = { value: '1000' };
const document = { addEventListener() {}, getElementById(id) { return id === 'portfolio-initial-capital' ? capital : {}; }, querySelector() { return null; }, querySelectorAll() { return []; }, activeElement: null };
const window = { addEventListener() {}, dispatchEvent(event) { events.push(event); }, setTimeout, SportLabCore: { cloud: { async syncNow() {}, markDirty() {} } } };
const context = vm.createContext({ window, document, console: { log() {}, warn() {}, error(...args) { throw new Error(args.join(' ')); } }, performance, Date, Map, WeakMap, setTimeout, clearTimeout, CustomEvent: class { constructor(type, options) { this.type = type; Object.assign(this, options); } }, localStorage: { getItem() { return null; }, setItem() {} }, requestAnimationFrame() {} });
const cache = new Map();
const dependencies = new Map([...source.matchAll(/import\s*\{([\s\S]*?)\}\s*from\s*["']([^"']+)["']/g)].map(m => [m[2], m[1].split(',').map(x => x.trim()).filter(Boolean)]));
function loader(kind) {
  return options => {
    calls[kind]++;
    assert.equal(options.previousMatches.length, sizes[kind]);
    assert.ok(['startup', 'manual'].includes(options.refreshMode));
    options.onProgress({ ...payload(1), meta: { loading: true, phase: 'fixtures' } });
    return new Promise(resolve => pending.set(kind, resolve));
  };
}
const overrides = {
  loadLocalApplicationData: () => ({}),
  loadDrawHunterApplicationData: loader('drawhunter'), loadFrenchFlairApplicationData: loader('frenchflair'), loadNflApplicationData: loader('nfl'),
  readSportsSnapshot: async kind => ({ payload: payload(sizes[kind]), savedAt: Date.now() - 64 * 60000, ageMs: 64 * 60000, stale: false }),
  snapshotPayloadForDisplay: record => ({ ...record.payload, meta: { ...record.payload.meta, snapshot: true, snapshotSavedAt: new Date(record.savedAt).toISOString(), loading: false } }),
  writeSportsSnapshot: async () => true,
  evaluatePendingPredictions: async () => ({ evaluated: 0 }), runAutomaticSettlement: async () => ({ settledCount: 0 }),
  renderApplication: (app, data) => renders.push(data),
  loadApplicationData: () => { throw new Error('unguarded sports load'); }
};
async function linker(specifier) {
  if (cache.has(specifier)) return cache.get(specifier);
  let module;
  if (specifier.includes('loadCycleGuard.js') || specifier.includes('performanceInstrumentation.js')) {
    module = new vm.SourceTextModule(fs.readFileSync(new URL(specifier, root), 'utf8'), { context });
    cache.set(specifier, module);
    await module.link(linker);
  } else {
    const names = dependencies.get(specifier);
    assert.ok(names, specifier);
    module = new vm.SyntheticModule(names, function() { for (const name of names) this.setExport(name, overrides[name] || (() => {})); }, { context });
    cache.set(specifier, module);
  }
  return module;
}
const runtime = new vm.SourceTextModule(source, { context });
await runtime.link(linker);
await runtime.evaluate();
await Promise.all([runtime.namespace.startLegacyApplication(), runtime.namespace.startLegacyApplication()]);
assert.deepEqual(calls, { drawhunter: 1, frenchflair: 1, nfl: 1 });
assert.equal(runtime.namespace.getLegacyRuntimeState().sportsRefreshInFlight, true);
assert.equal(runtime.namespace.getLegacyRuntimeState().drawHunterReady, true);
assert.equal(runtime.namespace.getLegacyRuntimeState().frenchFlairReady, true);
assert.equal(runtime.namespace.getLegacyRuntimeState().nflReady, true);
assert.equal(renders.at(-1).drawhunterPayload.matches.length, 8);
assert.equal(renders.at(-1).drawhunterPayload.meta.loading, false);
const tick = () => new Promise(resolve => setImmediate(resolve));
for (const [kind, resolve] of pending) resolve(process.argv.includes('--startup-error') && kind === 'drawhunter'
  ? { matches: [], meta: { error: true, errorMessage: 'startup offline', phase: 'error' } } : payload(sizes[kind]));
await tick();
assert.equal(runtime.namespace.getLegacyRuntimeState().sportsRefreshInFlight, false);
await window.runSportLabCloudSync();
await window.savePortfolioInitialCapital();
await runtime.namespace.startLegacyApplication();
assert.deepEqual(calls, { drawhunter: 1, frenchflair: 1, nfl: 1 });
let report = cache.get('./core/diagnostics/performanceInstrumentation.js').namespace.getPerformanceReport();
for (const kind of Object.keys(sizes)) {
  assert.equal(report.modules[kind].cycles.length, 1);
  assert.ok(report.modules[kind].readyAtMs !== null);
  assert.ok(report.modules[kind].completeMs !== null);
}
const first = window.refreshSportLab();
assert.equal(window.refreshSportLab(), first);
assert.deepEqual(calls, { drawhunter: 2, frenchflair: 2, nfl: 2 });
for (const [kind, resolve] of pending) resolve(kind === 'drawhunter' ? { matches: [], meta: { error: true, errorMessage: 'offline', phase: 'error' } } : payload(sizes[kind]));
await first;
assert.equal(calls.drawhunter, 2); // usable snapshot prevents full-sweep startup retries
assert.equal(renders.at(-1).drawhunterPayload.matches.length, 8);
assert.equal(renders.at(-1).drawhunterPayload.meta.refreshError, true);
report = cache.get('./core/diagnostics/performanceInstrumentation.js').namespace.getPerformanceReport();
for (const kind of Object.keys(sizes)) {
  assert.equal(report.modules[kind].cycles.length, 2);
  assert.equal(report.modules[kind].cycles[1].trigger, 'manual');
  assert.equal(report.modules[kind].cycles[1].parentCycleId, report.modules[kind].cycles[0].loadCycleId);
}
// A later deliberate refresh remains possible after the previous cycle completes.
const second = window.refreshSportLab();
assert.deepEqual(calls, { drawhunter: 3, frenchflair: 3, nfl: 3 });
for (const [kind, resolve] of pending) resolve(payload(sizes[kind]));
await second;
console.log('Runtime integration passed');
