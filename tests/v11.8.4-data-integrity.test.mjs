import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { saveLearningRecord } from '../core/learning/learningStore.js';
import { capturePredictionDataset } from '../core/learning/learningDatasetBuilder.js';
import { createPerformanceRepository } from '../core/performance/performanceRepository.js';

function quotaStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  let first = true;
  return {
    get length(){ return data.size; },
    key(i){ return [...data.keys()][i] ?? null; },
    getItem(k){ return data.has(k) ? data.get(k) : null; },
    removeItem(k){ data.delete(k); },
    setItem(k,v){
      if (first) { first = false; const e = new Error('quota'); e.name='QuotaExceededError'; throw e; }
      data.set(k,String(v));
    }
  };
}

test('V11.8.4 protects Learning Store writes from Safari quota', () => {
  const storage = quotaStorage({'sportlab.v9.history.rugby':'cache'});
  saveLearningRecord({learningId:'l1', probability:.6}, storage);
  assert.match(storage.getItem('sportlab_learning_v1'), /l1/);
  assert.equal(storage.getItem('sportlab.v9.history.rugby'), null);
});

test('V11.8.4 protects prediction dataset writes from Safari quota', () => {
  const storage = quotaStorage({'sportlab.v9.history.nfl':'cache'});
  const rows = capturePredictionDataset({nfl:[{id:'n1', probability:.61}]}, storage);
  assert.equal(rows.length, 1);
  assert.ok(storage.getItem('sportlab.v7.learning.dataset'));
});

test('V11.8.4 protects legacy performance repository writes from Safari quota', () => {
  const storage = quotaStorage({'sportlab.v9.history.football':'cache'});
  createPerformanceRepository(storage).write([{id:'p1'}]);
  assert.match(storage.getItem('sportlab.v7.modelPerformance.records'), /p1/);
});

test('V11.8.4 cloud sync covers all historical measurement stores', () => {
  const source = fs.readFileSync(new URL('../core/sync/localDataAdapter.js', import.meta.url), 'utf8');
  for (const key of ['sportlab_learning_v1','sportlab.v7.learning.dataset','sportlab.v7.modelPerformance.records','sportlab_bets_v3']) assert.match(source, new RegExp(key.replaceAll('.', '\\.')));
  assert.match(source, /quotaSafeSetItem\(key, raw, localStorage\)/);
});

test('V11.8.4 UI states the distinct populations instead of implying one history', () => {
  const perf = fs.readFileSync(new URL('../ui/views/modelPerformanceView.js', import.meta.url), 'utf8');
  const cal = fs.readFileSync(new URL('../ui/views/calibrationView.js', import.meta.url), 'utf8');
  assert.match(perf, /Snapshots présents/);
  assert.match(perf, /ROI paris réglés/);
  assert.match(perf, /pari\(s\) placé\(s\) et réglé\(s\)/);
  assert.match(cal, /calibrable\(s\)/);
  assert.match(cal, /exclue\(s\)/);
});
