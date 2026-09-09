import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildCalibrationDashboard } from '../core/calibration/calibrationEngine.js';
import { buildModelPerformance } from '../core/performance/modelPerformanceEngine.js';
import { capturePredictionDataset } from '../core/learning/learningDatasetBuilder.js';
import { getTeamLogoUrl } from '../core/ui/teamBranding.js';

function memoryStorage(){ let data={}; return {getItem:k=>data[k]??null,setItem:(k,v)=>{data[k]=String(v)},removeItem:k=>delete data[k],key:i=>Object.keys(data)[i]??null,get length(){return Object.keys(data).length}}; }

test('V11.4.4 Calibration exposes a dedicated NFL Totals module', () => {
  const dashboard = buildCalibrationDashboard([{moduleId:'nfl', probability:.62, result:'WON', evaluatedAt:'2026-09-10T12:00:00Z', competition:'NFL'}]);
  assert.equal(dashboard.modules.nfl.count, 1);
  assert.equal(dashboard.modules.frenchflair.count, 0);
  const view = fs.readFileSync(new URL('../ui/views/calibrationView.js', import.meta.url),'utf8');
  assert.match(view, /NFL Totals/);
});

test('V11.4.4 Performance separates NFL ROI from Rugby and DrawHunter', () => {
  const performance = buildModelPerformance({
    dataset:[{id:'nfl:1',matchId:1,moduleId:'nfl',modelVersion:'NFL-TOTALS-11.4.1'}],
    learning:[{learningId:'nfl:1',matchId:1,moduleId:'nfl',probability:.60,result:'WON',predictionCorrect:true,evaluatedAt:'2026-09-10'}],
    bets:[{matchId:1,source:'NFL Totals',sport:'nfl',placed:true,result:'WON',stake:10,odds:1.9}],
    analyses:[]
  });
  assert.equal(performance.nfl.evaluated,1);
  assert.equal(performance.nfl.settledBets,1);
  assert.equal(Math.round(performance.nfl.profit*10)/10,9);
  assert.equal(performance.frenchflair.settledBets,0);
});

test('V11.4.4 learning dataset captures NFL predictions with dedicated model version', () => {
  const storage=memoryStorage();
  const rows=capturePredictionDataset({nfl:[{id:21513,date:'2026-09-10',probability:.58,recommendedTrend:'OVER',predictedTotalPoints:46.8,sigma:9.4,competition:'NFL'}]},storage);
  assert.equal(rows[0].moduleId,'nfl');
  assert.equal(rows[0].modelVersion,'NFL-TOTALS-11.4.1');
});

test('V11.4.4 automatic prediction evaluation uses NFL result endpoint', () => {
  const code=fs.readFileSync(new URL('../core/performance/predictionEvaluationEngine.js', import.meta.url),'utf8');
  assert.match(code, /\/nfl\/game-result/);
  assert.match(code, /snapshot\.moduleId === "nfl"/);
});

test('V11.4.4 Paris and Journal receive NFL branding and unified Bet Store data', () => {
  const render=fs.readFileSync(new URL('../services/renderService.js', import.meta.url),'utf8');
  const journal=fs.readFileSync(new URL('../services/journalService.js', import.meta.url),'utf8');
  assert.match(render, /nfl: data\.nflPayload\?\.matches/);
  assert.match(render, /nfl\.forEach\(match => register\(match, "nfl"\)\)/);
  assert.match(journal, /getAllBets/);
  assert.equal(getTeamLogoUrl({sport:'nfl',teamId:23}), 'https://media.api-sports.io/american-football/teams/23.png');
});

test('V11.4.4 Performance UI displays all three SportLab models', () => {
  const view=fs.readFileSync(new URL('../ui/views/modelPerformanceView.js', import.meta.url),'utf8');
  assert.match(view,/DrawHunter/); assert.match(view,/FrenchFlair/); assert.match(view,/NFL Totals/);
});
