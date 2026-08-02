import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../ui/interactions/drawHunterWorkflow.js', import.meta.url), 'utf8');

test('V10.1.1 ne recharge plus la page après une analyse DrawHunter', () => {
  assert.equal(source.includes('location.reload()'), false);
  assert.equal(source.includes('updateDrawHunterCardState(card, status)'), true);
});

test('V10.1.1 enchaîne la prochaine analyse DrawHunter', () => {
  assert.equal(source.includes('remainingCards[0]'), true);
  assert.equal(source.includes('scrollIntoView({ behavior: "smooth", block: "start" })'), true);
  assert.equal(source.includes('Analyse enregistrée'), true);
});
