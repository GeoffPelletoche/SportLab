import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('V11.3.1 règle aussi les paris DrawHunter', () => {
  const source = read('core/engines/betSettlementEngine.js');
  assert.match(source, /\/football\/game-result/);
  assert.match(source, /market === "DRAW"/);
  assert.match(source, /return game\.isDraw \? "WON" : "LOST"/);
});

test('V11.3.1 garde les rencontres futures accessibles après sauvegarde', () => {
  const draw = read('modules/drawhunter.js');
  const rugby = read('modules/frenchflair.js');
  assert.equal(draw.includes('visibleMatches = matches.filter'), false);
  assert.match(draw, /matches,/);
  assert.equal(rugby.includes('predictedMatches.filter'), false);
  assert.match(rugby, /const matches = predictedMatches/);
});

test('V11.3.1 permet de rouvrir une analyse avant le coup d’envoi', () => {
  const drawView = read('ui/views/drawhunterView.js');
  const drawFlow = read('ui/interactions/drawHunterWorkflow.js');
  const rugbyView = read('ui/views/frenchflairView.js');
  const rugbyFlow = read('ui/interactions/frenchFlairWorkflow.js');

  assert.match(drawView, /Modifier l’analyse/);
  assert.match(drawFlow, /kind === "edit"/);
  assert.match(drawFlow, /Réévaluation autorisée avant le coup d’envoi/);
  assert.match(rugbyView, /Modifier l’analyse/);
  assert.match(rugbyFlow, /kind === "edit"/);
  assert.match(rugbyFlow, /analyzeFrenchFlairValue/);
});

test('V11.3.1 réutilise une abstention si elle devient un pari', () => {
  const source = read('core/stores/betsStore.js');
  assert.match(source, /\["PENDING", "NON_PLACED"\]\.includes\(result\)/);
});
