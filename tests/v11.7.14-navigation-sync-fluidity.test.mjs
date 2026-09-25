import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const legacy = fs.readFileSync(new URL('../legacyApp.js', import.meta.url), 'utf8');
const sync = fs.readFileSync(new URL('../core/sync/syncEngine.js', import.meta.url), 'utf8');

test('V11.7.14 validation republishes local state without restarting sports refresh', () => {
  assert.match(legacy, /function commitLocalAnalysisAndNavigate\(matchId\)/);
  const helper = legacy.match(/function commitLocalAnalysisAndNavigate\(matchId\) \{[\s\S]*?\n\}/)?.[0] || '';
  assert.match(helper, /loadLocalApplicationData\(\)/);
  assert.match(helper, /requestStableRender\(\{ force: true \}\)/);
  assert.doesNotMatch(helper, /init\(/);
  assert.doesNotMatch(helper, /refreshDrawHunterData|refreshFrenchFlairData|refreshNflData/);
});

test('V11.7.14 all three modules use deterministic post-validation navigation', () => {
  assert.match(legacy, /saveDrawHunterBet[\s\S]*?commitLocalAnalysisAndNavigate\(matchId\)/);
  assert.match(legacy, /saveFrenchFlairAnalysis[\s\S]*?commitLocalAnalysisAndNavigate\(matchId\)/);
  assert.match(legacy, /saveFrenchFlairBet[\s\S]*?commitLocalAnalysisAndNavigate\(matchId\)/);
  assert.match(legacy, /saveNflAnalysis=.*?commitLocalAnalysisAndNavigate\(matchId\)/);
  assert.match(legacy, /saveNflBet=.*?commitLocalAnalysisAndNavigate\(matchId\)/);
});

test('V11.7.14 cloud capture is deferred off the immediate domain-change path', () => {
  assert.match(sync, /const onDomainChange = \(\) => \{ diff\.markDirty\(\); scheduler\.schedule\("change"\); \};/);
  assert.doesNotMatch(sync, /const onDomainChange = \(\) => \{[^}]*captureOrDefer/);
});
