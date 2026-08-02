import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const moduleSource = readFileSync(new URL('../modules/drawhunter.js', import.meta.url), 'utf8');
const viewSource = readFileSync(new URL('../ui/views/drawhunterView.js', import.meta.url), 'utf8');
const workflowSource = readFileSync(new URL('../ui/interactions/drawHunterWorkflow.js', import.meta.url), 'utf8');
const legacySource = readFileSync(new URL('../legacyApp.js', import.meta.url), 'utf8');

test('V10.1.2 ne simule plus une cote fixe à 3.10', () => {
  assert.equal(moduleSource.includes('return 3.1'), false);
  assert.equal(moduleSource.includes('odds: null'), true);
});

test('V10.1.2 affiche une saisie manuelle de cote bookmaker', () => {
  assert.equal(viewSource.includes('data-dh-bookmaker-odds'), true);
  assert.equal(viewSource.includes('Cote bookmaker du match nul'), true);
  assert.equal(viewSource.includes('placeholder="Ex : 3.16"'), true);
});

test('V10.1.2 recalcule et persiste la value', () => {
  assert.equal(workflowSource.includes('computeValue({'), true);
  assert.equal(workflowSource.includes('bookmakerOdds: valuation?.odds'), true);
  assert.equal(workflowSource.includes('Cote bookmaker requise'), true);
});

test('V10.1.2 enregistre le pari avec la cote manuelle', () => {
  assert.equal(legacySource.includes('odds: bookmakerOdds'), true);
  assert.equal(legacySource.includes('value: valuation.value'), true);
});
