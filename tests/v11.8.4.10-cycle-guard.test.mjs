import test from 'node:test';
import assert from 'node:assert/strict';
import { createLoadCycleGuard } from '../core/app/loadCycleGuard.js';
import { markModuleStart, markModuleProgress, markModuleComplete, getPerformanceReport } from '../core/diagnostics/performanceInstrumentation.js';

test('one execution per module and cycle survives snapshot mutation and completion', () => {
  const guard = createLoadCycleGuard({ sessionId: 'session' });
  const startup = guard.createCycle('startup');
  for (const module of ['drawhunter', 'frenchflair', 'nfl']) {
    assert.equal(guard.claim(module, startup, { meta: { snapshotSavedAt: 'old' } }), true);
    assert.equal(guard.claim(module, startup, { meta: { snapshotSavedAt: 'new' } }), false);
    assert.equal(guard.context(module, startup).snapshotVersion, 'old');
  }
  const manual = guard.createCycle('manual', startup.loadCycleId);
  assert.notEqual(manual.loadCycleId, startup.loadCycleId);
  assert.equal(guard.claim('drawhunter', manual, {}), true);
  assert.equal(guard.context('drawhunter', manual).parentCycleId, startup.loadCycleId);
});

test('diagnostics distinguish snapshot readiness from cycle completion and attribute phases', () => {
  const name = 'cycle-guard-test';
  const context = { loadCycleId: 'test#1', trigger: 'startup', snapshotVersion: 'snapshot-1', parentCycleId: null };
  const payload = { matches: [{ homeHistory: [{}], awayHistory: [{}] }], meta: { snapshot: true, loading: false } };
  markModuleStart(name, context);
  markModuleProgress(name, payload);
  let report = getPerformanceReport().modules[name];
  assert.ok(report.readyAtMs !== null);
  assert.equal(report.completeMs, null);
  assert.equal(report.phases[0].loadCycleId, 'test#1');
  assert.equal(report.phases[0].trigger, 'startup');
  assert.equal(report.phases[0].module, name);
  markModuleComplete(name, { ...payload, meta: { phase: 'complete' } });
  const completed = getPerformanceReport().modules[name].completeMs;
  markModuleComplete(name, { ...payload, meta: { phase: 'complete' } });
  report = getPerformanceReport().modules[name];
  assert.equal(report.completeMs, completed);
  assert.equal(report.phases.filter(p => p.phase === 'complete').length, 1);
  assert.equal(report.cycles.length, 1);
});

import { spawnSync } from 'node:child_process';
test('runtime keeps snapshots ready, avoids local/cloud reloads, coalesces manual clicks and preserves failure fallback', () => {
  for (const extra of [[], ['--startup-error']]) {
    const result = spawnSync(process.execPath, ['--experimental-vm-modules', new URL('./cycleGuardRuntimeHarness.mjs', import.meta.url).pathname, ...extra], { encoding: 'utf8', timeout: 10000 });
    assert.equal(result.status, 0, result.stderr + result.stdout);
  }
});
