import test from "node:test";
import assert from "node:assert/strict";
import { saveLearningRecord, getLearningRecords, buildLearningSummary, getLearningMaturity } from "../core/learning/learningStore.js";

function memoryStorage() {
  const data = new Map();
  return { getItem:k=>data.has(k)?data.get(k):null, setItem:(k,v)=>data.set(k,String(v)), removeItem:k=>data.delete(k) };
}

test("Learning Store déduplique les évaluations", () => {
  const storage = memoryStorage();
  saveLearningRecord({ learningId:"dh:1", moduleId:"drawhunter", evaluatedAt:"2026-01-01", predictionCorrect:true, decisionCorrect:true }, storage);
  saveLearningRecord({ learningId:"dh:1", moduleId:"drawhunter", evaluatedAt:"2026-01-02", predictionCorrect:false, decisionCorrect:true }, storage);
  const records = getLearningRecords(storage);
  assert.equal(records.length, 1);
  assert.equal(records[0].predictionCorrect, false);
});

test("Le résumé sépare prédiction et décision", () => {
  const summary = buildLearningSummary([
    { learningId:"1", moduleId:"drawhunter", competition:"Ligue 1", evaluatedAt:"x", predictionCorrect:true, decisionCorrect:false, factors:[{key:"balance",label:"Équilibre"}] },
    { learningId:"2", moduleId:"drawhunter", competition:"Ligue 1", evaluatedAt:"x", predictionCorrect:false, decisionCorrect:true, factors:[{key:"balance",label:"Équilibre"}] }
  ]);
  assert.equal(summary.predictionAccuracy, 50);
  assert.equal(summary.decisionAccuracy, 50);
  assert.equal(summary.factors[0].uses, 2);
});

test("La maturité ne permet jamais un changement automatique", () => {
  const records = Array.from({length:1200}, (_,i)=>({evaluatedAt:"x", competition:`C${i%6}`, moduleId:i%2?"drawhunter":"frenchflair"}));
  const maturity = getLearningMaturity(records);
  assert.equal(maturity.level, 3);
  assert.equal(maturity.modelCanChangeAutomatically, false);
  assert.equal(maturity.candidateAvailable, false);
});
