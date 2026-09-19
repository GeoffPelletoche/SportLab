import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('V11.5.4 ne modifie jamais la DOMException quota Safari', () => {
  const source = fs.readFileSync(new URL('../core/sync/queueManager.js', import.meta.url), 'utf8');
  assert.match(source, /const wrapped = new Error/);
  assert.match(source, /wrapped\.code = "local_storage_quota_exceeded"/);
  assert.doesNotMatch(source, /error\.code\s*=/);
  assert.doesNotMatch(source, /error\.storage\s*=/);
});
