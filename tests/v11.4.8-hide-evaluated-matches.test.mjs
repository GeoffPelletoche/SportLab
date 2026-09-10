import test from "node:test";
import assert from "node:assert/strict";
import { filterUnevaluatedMatches, isMatchEvaluated } from "../core/performance/evaluatedMatchRegistry.js";
import { renderNfl } from "../ui/views/nflView.js";
import { renderFrenchFlair } from "../ui/views/frenchflairView.js";
import { renderDrawHunter } from "../ui/views/drawhunterView.js";

function storageWith(dataset = []) {
  const map = new Map([["sportlab.v7.learning.dataset", JSON.stringify(dataset)]]);
  return {
    getItem: key => map.has(key) ? map.get(key) : null,
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: key => map.delete(key)
  };
}

function evaluated(moduleId, matchId) {
  return { id:`${moduleId}:${matchId}`, moduleId, matchId, modelVersion:"test", evaluatedAt:"2026-09-10T06:00:00.000Z" };
}

test("V11.4.8 registry excludes an evaluated match independently of bet or analysis state", () => {
  const storage = storageWith([evaluated("nfl", 101)]);
  assert.equal(isMatchEvaluated("nfl", 101, storage), true);
  assert.equal(isMatchEvaluated("nfl", 102, storage), false);
  assert.deepEqual(filterUnevaluatedMatches("nfl", [{id:101},{id:102}], storage), [{id:102}]);
});

test("V11.4.8 NFL Totals no longer renders an evaluated fixture", () => {
  const previous = globalThis.localStorage;
  globalThis.localStorage = storageWith([evaluated("nfl", 201)]);
  try {
    const html = renderNfl({ matches:[
      {id:201, away:"Old Away", home:"Old Home", predictionStatus:"OK", recommendedTrend:"OVER", confidence:80},
      {id:202, away:"Next Away", home:"Next Home", predictionStatus:"OK", recommendedTrend:"UNDER", confidence:70}
    ], meta:{} });
    assert.equal(html.includes("Old Away"), false);
    assert.equal(html.includes("Next Away"), true);
  } finally { globalThis.localStorage = previous; }
});

test("V11.4.8 FrenchFlair and DrawHunter also hide evaluated fixtures", () => {
  const previous = globalThis.localStorage;
  globalThis.localStorage = storageWith([
    evaluated("frenchflair", 301),
    evaluated("drawhunter", 401)
  ]);
  try {
    const ff = renderFrenchFlair({ matches:[
      {id:301, home:"Old Rugby Home", away:"Old Rugby Away", predictionStatus:"OK", recommendedTrend:"OVER", predictedTotalPoints:50, sigma:10, confidence:75, date:"2026-09-09T20:00:00Z"},
      {id:302, home:"Next Rugby Home", away:"Next Rugby Away", predictionStatus:"OK", recommendedTrend:"UNDER", predictedTotalPoints:40, sigma:10, confidence:75, date:"2026-09-11T20:00:00Z"}
    ], meta:{} });
    assert.equal(ff.includes("Old Rugby Home"), false);
    assert.equal(ff.includes("Next Rugby Home"), true);

    const dh = renderDrawHunter({ matches:[
      {id:401, home:"Old Football Home", away:"Old Football Away", probability:0.31, date:"2026-09-09T20:00:00Z"},
      {id:402, home:"Next Football Home", away:"Next Football Away", probability:0.30, date:"2026-09-11T20:00:00Z"}
    ], meta:{} });
    assert.equal(dh.includes("Old Football Home"), false);
    assert.equal(dh.includes("Next Football Home"), true);
  } finally { globalThis.localStorage = previous; }
});
