import test from 'node:test';
import assert from 'node:assert/strict';
import { renderDrawHunter } from '../ui/views/drawhunterView.js';
import { isDrawHunterWorkflowOpen } from '../core/stores/drawHunterWorkflowStore.js';

const memory = new Map();
globalThis.localStorage = { getItem: key => memory.get(key) || null, setItem: (key, value) => memory.set(key, value) };
const match = id => ({ id, home: `Home ${id}`, away: `Away ${id}`, date: '2030-01-01T12:00:00Z', probability: 0.3, homeHistory: [], awayHistory: [] });
test('finished/placed/legacy cards disappear on render; unfinished valuation remains editable', () => {
  memory.clear();
  const workflow = {
    1: { status: 'pending', decision: 'NO BET', value: 0 },
    2: { status: 'awaiting_result', decision: 'NO BET', value: 0 },
    3: { status: 'awaiting_result', decision: 'VALUE BET', placed: true },
    4: { status: 'analyzed', value: 0.0001 },
    5: { status: 'pending', placed: true },
    6: { status: 'archived' }
  };
  memory.set('sportlab_drawhunter_workflow_v1', JSON.stringify(workflow));
  memory.set('sportlab_bets_v3', JSON.stringify([{ id: 'saved', source: 'DrawHunter', sport: 'football', matchId: 7, placed: false, decision: 'NO BET' }, { id: 'other', source: 'FrenchFlair', sport: 'rugby', matchId: 8, placed: true }]));
  const before = [...memory.entries()];
  const html = renderDrawHunter({ matches: Array.from({ length: 9 }, (_, i) => match(i + 1)), meta: { loading: false } });
  for (const id of [1, 8, 9]) assert.ok(html.includes(`data-match-id="${id}"`), `open ${id}`);
  for (const id of [2, 3, 4, 5, 6, 7]) assert.ok(!html.includes(`data-match-id="${id}"`), `closed ${id}`);
  assert.deepEqual([...memory.entries()], before); // filtering never deletes saved records
  assert.equal(isDrawHunterWorkflowOpen(match(1), workflow[1]), true);
});

import { spawnSync } from 'node:child_process';
test('Terminer hides a near-zero/no-bet card immediately and delegates navigation to the runtime', () => {
  const result = spawnSync(process.execPath, ['--experimental-vm-modules', new URL('./drawHunterInteractionHarness.mjs', import.meta.url).pathname], { encoding: 'utf8', timeout: 10000 });
  assert.equal(result.status, 0, result.stderr + result.stdout);
});
