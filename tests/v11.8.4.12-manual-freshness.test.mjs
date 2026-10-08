import test from 'node:test';
import assert from 'node:assert/strict';
import { fixtureRefreshPolicy } from '../core/api/fixtureRefreshPolicy.js';
import { fetchUpcomingFootballFixtures } from '../core/api/footballService.js';
import { fetchUpcomingRugbyFixtures } from '../core/api/rugbyService.js';
import { fetchUpcomingNflFixtures } from '../core/api/nflService.js';
import { writeSportsSnapshot } from '../core/api/sportsSnapshotStore.js';
const now = Date.parse('2026-10-08T16:11:02Z');
const payload = (ageMs = 4 * 60000) => ({ matches: [{ id: 1, date: '2026-10-09T18:00:00Z', homeHistory: [{}], awayHistory: [{}] }], meta: { syncedAt: new Date(now - ageMs).toISOString(), snapshotSavedAt: new Date(now).toISOString() } });
const policy = (data, extra = {}) => fixtureRefreshPolicy({ previousPayload: data, refreshMode: 'manual', now, ...extra });

test('first manual refresh after reopening uses verified snapshots under five minutes', () => {
  for (const age of [135000, 259000, 254000]) {
    assert.equal(policy(payload(age)).action, 'skip');
    assert.equal(policy(payload(age)).reason, 'recently-verified-snapshot');
  }
  assert.equal(policy(payload(300000)).action, 'refresh');
});
test('saving or repeatedly reusing old snapshots cannot extend verification freshness', () => {
  const data = payload(6 * 60000);
  assert.equal(policy(data).reason, 'manual-snapshot-expired');
  assert.equal(policy({ ...data, meta: { ...data.meta, fixtureRefreshSkipped: true } }).action, 'refresh');
  const startup = fixtureRefreshPolicy({ previousPayload: payload(61 * 60000), now });
  assert.equal(startup.reason, 'aging-snapshot');
});
test('force, failures, incomplete history and date-range changes bypass recent snapshot reuse', () => {
  const data = payload();
  assert.equal(policy(data, { refreshMode: 'force' }).reason, 'forced');
  assert.equal(policy({ ...data, meta: { ...data.meta, syncLog: [{ status: 'RATE_LIMITED' }] } }).action, 'refresh');
  assert.equal(policy({ ...data, meta: { ...data.meta, refreshError: true } }).action, 'refresh');
  assert.equal(policy({ ...data, matches: [{ ...data.matches[0], awayHistory: [] }] }).action, 'refresh');
  assert.equal(policy({ ...data, meta: { ...data.meta, from: '2026-10-07' } }, { range: { from: '2026-10-08', to: '2026-10-09' } }).reason, 'changed-date-range');
});
test('manual reuse shortens to one minute near kickoff and stops when kickoff crosses', () => {
  const data = payload(59000);
  data.matches[0].date = new Date(now + 10 * 60000).toISOString();
  assert.equal(policy(data).action, 'skip');
  assert.equal(policy({ ...data, meta: { syncedAt: new Date(now - 60000).toISOString() } }).reason, 'near-kickoff');
  data.matches[0].date = new Date(now - 1000).toISOString();
  assert.equal(policy(data).reason, 'kickoff-crossed');
});
test('all real sport services reuse a reopened snapshot without scheduling requests', async () => {
  const previous = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('unexpected network'); };
  const data = payload(); data.meta.syncedAt = new Date(Date.now() - 4 * 60000).toISOString();
  try {
    for (const service of [fetchUpcomingFootballFixtures, fetchUpcomingRugbyFixtures, fetchUpcomingNflFixtures]) {
      const result = await service({ previousPayload: data, previousMatches: data.matches, refreshMode: 'manual' });
      assert.equal(result.fixtures, data.matches);
      assert.equal(result.meta.fixtureRefreshSkipped, true);
      assert.equal(result.meta.syncedAt, data.meta.syncedAt);
      assert.equal(result.meta.fixtureRefreshReason, 'recently-verified-snapshot');
    }
  } finally { globalThis.fetch = previous; }
});
test('cooldown writes never reopen IndexedDB or relabel reused data as newly saved', async () => {
  const previous = globalThis.indexedDB;
  globalThis.indexedDB = { open() { throw new Error('must not write a reused snapshot'); } };
  try {
    assert.equal(await writeSportsSnapshot('drawhunter', { ...payload(), meta: { loading: false, fixtureRefreshSkipped: true } }), false);
  } finally { if (previous === undefined) delete globalThis.indexedDB; else globalThis.indexedDB = previous; }
});

test('dashboard routes Actualiser and Forcer separately and releases its button', async () => {
  const previousWindow = globalThis.window;
  const previousDocument = globalThis.document;
  const options = [];
  let handler;
  globalThis.window = { refreshSportLab(value) { options.push(value); return Promise.resolve(); } };
  globalThis.document = { addEventListener(type, callback) { handler = callback; } };
  try {
    const { initDashboardPremium } = await import('../ui/interactions/dashboardPremium.js');
    initDashboardPremium();
    for (const mode of ['', 'force']) {
      const button = { dataset: { refreshMode: mode }, disabled: false, setAttribute() {}, removeAttribute() {}, classList: { add() {}, remove() {} } };
      handler({ target: { closest: selector => selector === '[data-dashboard-refresh]' ? button : null } });
      assert.equal(button.disabled, true);
      await Promise.resolve();
      assert.equal(button.disabled, false);
    }
    assert.deepEqual(options, [{ forceFresh: false }, { forceFresh: true }]);
  } finally { globalThis.window = previousWindow; globalThis.document = previousDocument; }
});
