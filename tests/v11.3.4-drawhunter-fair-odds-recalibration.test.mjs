import test from 'node:test';
import assert from 'node:assert/strict';
import { predictDrawMatch } from '../core/engines/footballDrawPredictionEngine.js';
import { MODEL_VERSIONS } from '../core/scoring/scoringSchema.js';

function makeHistory({ draws = 10, lowScoring = 16, total = 30, gfBase = 1.3, gaBase = 1.2 } = {}) {
  return Array.from({ length: total }, (_, i) => {
    const isDraw = i < draws;
    const isLow = i < lowScoring;
    let goalsFor;
    let goalsAgainst;
    if (isDraw) {
      goalsFor = isLow ? 1 : 2;
      goalsAgainst = goalsFor;
    } else if (isLow) {
      goalsFor = i % 2 ? 1 : 0;
      goalsAgainst = i % 2 ? 0 : 1;
    } else {
      goalsFor = Math.max(0, Math.round(gfBase + (i % 2)));
      goalsAgainst = Math.max(0, Math.round(gaBase + ((i + 1) % 2)));
      if (goalsFor === goalsAgainst) goalsAgainst += 1;
    }
    return {
      id: `g-${i}-${draws}-${lowScoring}`,
      date: `2026-${String((i % 8) + 1).padStart(2, '0')}-${String((i % 27) + 1).padStart(2, '0')}`,
      status: 'FT', goalsFor, goalsAgainst
    };
  });
}

test('V11.3.4 ancre la probabilité sur le profil de nul au lieu de la gonfler vers 48 %', () => {
  const homeHistory = makeHistory({ draws: 10, lowScoring: 16 });
  const awayHistory = makeHistory({ draws: 10, lowScoring: 16 });
  const result = predictDrawMatch({ homeHistory, awayHistory });
  assert.equal(result.predictionStatus, 'OK');
  assert.ok(result.drawProfile > 0.30 && result.drawProfile < 0.38);
  assert.ok(result.probability >= 0.28 && result.probability <= 0.38);
  assert.ok(1 / result.probability >= 2.6);
  assert.notEqual(result.probability, 0.48);
});

test('V11.3.4 conserve une cote juste strictement dérivée de la probabilité', () => {
  const result = predictDrawMatch({
    homeHistory: makeHistory({ draws: 9, lowScoring: 15 }),
    awayHistory: makeHistory({ draws: 9, lowScoring: 15 })
  });
  const fairOdds = 1 / result.probability;
  assert.ok(fairOdds > 2.5 && fairOdds < 5.01);
  assert.equal(result.probabilityModel, 'DRAW_RATE_ANCHORED_V11_3_4');
});

test('V11.3.4 versionne séparément DrawHunter pour le learning et la calibration', () => {
  assert.equal(MODEL_VERSIONS.drawhunter, 'DH-11.3.4');
});
