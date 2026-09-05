import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const adapter = fs.readFileSync(new URL('../core/sync/localDataAdapter.js', import.meta.url), 'utf8');
const resolver = fs.readFileSync(new URL('../core/sync/conflictResolver.js', import.meta.url), 'utf8');

test('V11.3.11 does not auto-push missing localStorage keys as deletes', () => {
  assert.match(adapter, /if \(raw === null\)/);
  assert.match(adapter, /continue;/);
  const guardPos = adapter.indexOf('if (raw === null)');
  const pushPos = adapter.indexOf('changes.push', guardPos);
  assert.ok(guardPos >= 0 && pushPos > guardPos, 'missing-key guard must run before changes.push');
});

test('V11.3.11/V11.3.12 keep server tombstones authoritative over stale devices', () => {
  assert.match(resolver, /authoritativeServerDelete/);
  assert.match(resolver, /const authoritativeServerDelete = Boolean\(server\.deleted\)/);
  assert.match(resolver, /authoritativeServerDelete \|\| !local/);
});
