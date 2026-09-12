import test from "node:test";
import assert from "node:assert/strict";
import { renderNfl } from "../ui/views/nflView.js";

function storageWith({ dataset = [], bets = [] } = {}) {
  const map = new Map([
    ["sportlab.v7.learning.dataset", JSON.stringify(dataset)],
    ["sportlab_bets_v3", JSON.stringify(bets)]
  ]);
  return {
    getItem: key => map.has(key) ? map.get(key) : null,
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: key => map.delete(key)
  };
}

function match(id, name) {
  return {
    id,
    away: `${name} Away`,
    home: `${name} Home`,
    predictionStatus: "OK",
    recommendedTrend: "OVER",
    confidence: 80,
    predictedTotalPoints: 45,
    historicalReferenceTotal: 43,
    sigma: 12,
    predictedRangeLow: 33,
    predictedRangeHigh: 57,
    predictedAwayPoints: 21,
    predictedHomePoints: 24,
    date: "2026-09-13T18:00:00Z"
  };
}

test("V11.4.9 NFL Totals masque immédiatement un match avec pari placé", () => {
  const previous = globalThis.localStorage;
  globalThis.localStorage = storageWith({ bets: [{
    id: "bet-1", matchId: 501, sport: "nfl", source: "NFL Totals", placed: true, result: "PENDING"
  }] });
  try {
    const html = renderNfl({ matches: [match(501, "Placed"), match(502, "Open")], meta: {} });
    assert.equal(html.includes("Placed Away"), false);
    assert.equal(html.includes("Open Away"), true);
  } finally { globalThis.localStorage = previous; }
});

test("V11.4.9 une analyse NFL sans pari reste disponible", () => {
  const previous = globalThis.localStorage;
  globalThis.localStorage = storageWith({ bets: [{
    id: "bet-2", matchId: 601, sport: "nfl", source: "NFL Totals", placed: false, result: "NON_PLACED"
  }] });
  try {
    const html = renderNfl({ matches: [match(601, "NoBet")], meta: {} });
    assert.equal(html.includes("NoBet Away"), true);
  } finally { globalThis.localStorage = previous; }
});

test("V11.4.9 un pari d'un autre sport avec le même matchId ne masque pas la NFL", () => {
  const previous = globalThis.localStorage;
  globalThis.localStorage = storageWith({ bets: [{
    id: "bet-3", matchId: 701, sport: "football", source: "DrawHunter", placed: true, result: "PENDING"
  }] });
  try {
    const html = renderNfl({ matches: [match(701, "NFL")], meta: {} });
    assert.equal(html.includes("NFL Away"), true);
  } finally { globalThis.localStorage = previous; }
});
