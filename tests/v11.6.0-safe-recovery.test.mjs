import test from "node:test";
import assert from "node:assert/strict";
import { inspectRemoteRecords, applyRemoteRecords, acknowledgeChanges } from "../core/sync/localDataAdapter.js";
import { resolveConflicts } from "../core/sync/conflictResolver.js";

function install() {
  const store = new Map();
  global.localStorage = { getItem:k=>store.has(k)?store.get(k):null, setItem:(k,v)=>store.set(k,String(v)), removeItem:k=>store.delete(k) };
  global.window = { dispatchEvent() {} };
  global.CustomEvent = class { constructor(type, init){ this.type=type; this.detail=init?.detail; } };
}
const remote = raw => ({ namespace:"analyses", key:"sportlab_analyses_v1", payload:{storageKey:"sportlab_analyses_v1",raw}, deleted:false, version:2, serverUpdatedAt:200 });

test("Safe Recovery protège une divergence locale non suivie", () => {
  install();
  localStorage.setItem("sportlab_analyses_v1", JSON.stringify([{id:"local"}]));
  const result = inspectRemoteRecords([remote(JSON.stringify([{id:"cloud"}]))]);
  assert.equal(result.safeRecords.length, 0);
  assert.equal(result.conflicts.length, 1);
  assert.equal(JSON.parse(localStorage.getItem("sportlab_analyses_v1"))[0].id, "local");
});

test("Safe Recovery autorise Cloud si le local suivi est resté propre", () => {
  install();
  const before = JSON.stringify([{id:"before"}]);
  localStorage.setItem("sportlab_analyses_v1", before);
  acknowledgeChanges([{namespace:"analyses",key:"sportlab_analyses_v1",version:1,serverUpdatedAt:100}]);
  const result = inspectRemoteRecords([remote(JSON.stringify([{id:"cloud"}]))]);
  assert.equal(result.safeRecords.length, 1);
  assert.equal(result.conflicts.length, 0);
  assert.equal(result.mutations, 1);
});

test("Safe Recovery autorise le bootstrap d'un stockage vide", () => {
  install();
  const r = remote(JSON.stringify([{id:"cloud"}]));
  const result = inspectRemoteRecords([r]);
  assert.equal(result.safeRecords.length, 1);
  applyRemoteRecords(result.safeRecords);
  assert.equal(JSON.parse(localStorage.getItem("sportlab_analyses_v1"))[0].id, "cloud");
});

test("Les conflits 409 restent en décision explicite", () => {
  const result = resolveConflicts([{namespace:"analyses",key:"sportlab_analyses_v1",current:{namespace:"analyses",record_key:"sportlab_analyses_v1",version:3,client_updated_at:100,payload:{raw:"cloud"}}}], [{namespace:"analyses",key:"sportlab_analyses_v1",clientUpdatedAt:200,payload:{raw:"local"}}]);
  assert.equal(result.recordsToApply.length, 0);
  assert.equal(result.localToRetry.length, 0);
  assert.equal(result.decisions[0].winner, "pending");
});
