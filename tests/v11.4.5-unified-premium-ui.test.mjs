import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('V11.4.5 charge la feuille de style premium unifiée', () => {
  const html = read('index.html');
  assert.match(html, /modules-premium-v3\.css/);
});

test('V11.4.5 harmonise les préconisations des trois modules sans toucher aux appels moteurs', () => {
  const nfl = read('ui/views/nflView.js');
  const ff = read('ui/views/frenchflairView.js');
  const dh = read('ui/views/drawhunterView.js');
  assert.match(nfl, /Préconisation SportLab/);
  assert.match(nfl, /analyzeNflValue/);
  assert.match(ff, /ff-premium-recommendation/);
  assert.match(dh, /dh-premium-recommendation/);
  assert.match(dh, /computeValue/);
  assert.match(ff, /scoreAnalysis/);
});
