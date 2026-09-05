import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const bootstrap = fs.readFileSync(new URL('../core/app/bootstrap.js', import.meta.url), 'utf8');
const legacy = fs.readFileSync(new URL('../legacyApp.js', import.meta.url), 'utf8');

test('V11.3.14 exposes Cloud before legacy sports loading', () => {
  const corePos = bootstrap.indexOf('window.SportLabCore = Object.freeze');
  const legacyPos = bootstrap.indexOf('await startLegacyApplication()');
  assert.ok(corePos >= 0 && legacyPos >= 0 && corePos < legacyPos);
  assert.ok(bootstrap.indexOf('syncEngine.start()') < legacyPos);
});

test('V11.3.14 cloud events do not restart full sports init', () => {
  assert.match(legacy, /sportlab:cloud-config[\s\S]{0,120}renderCurrentApplication\(\)/);
});
