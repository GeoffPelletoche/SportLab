import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const legacy = fs.readFileSync(new URL("../legacyApp.js", import.meta.url), "utf8");

test("NFL keeps rendered snapshot matches addressable across background payload replacement", () => {
  assert.match(legacy, /const nflMatchRegistry = new Map\(\)/);
  assert.match(legacy, /rememberNflMatches\(nflPayload\?\.matches\)/);
  assert.match(legacy, /rememberNflMatches\(payload\?\.matches\)/);
  assert.match(legacy, /const current=nflPayload\?\.matches\?\.find/);
  assert.match(legacy, /return nflMatchRegistry\.get\(key\)\|\|null/);
});

test("NFL identity fallback is isolated from critical save paths", () => {
  assert.match(legacy, /window\.analyzeNflValue = function\(matchId\)/);
  assert.match(legacy, /window\.calculateNflAnalysis = function\(matchId\)/);
  assert.match(legacy, /window\.saveNflBet=function\(matchId\)/);
  assert.doesNotMatch(legacy, /nflMatchRegistry\.clear/);
});
