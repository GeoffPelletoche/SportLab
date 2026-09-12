import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const legacy = fs.readFileSync(new URL("../legacyApp.js", import.meta.url), "utf8");
const view = fs.readFileSync(new URL("../ui/views/drawhunterView.js", import.meta.url), "utf8");

test("DrawHunter bet save resolves the displayed match by stable matchId", () => {
  assert.match(legacy, /window\.saveDrawHunterBet = function\(matchId\)/);
  assert.match(legacy, /String\(item\?\.id\) === String\(matchId\)/);
  assert.doesNotMatch(legacy, /drawhunterPayload\?\.matches\?\.\[index\]/);
});

test("DrawHunter rendered bet form passes matchId instead of filtered list index", () => {
  assert.match(view, /onclick='saveDrawHunterBet\(\$\{JSON\.stringify\(String\(matchId\)\)\}\)'/);
  assert.doesNotMatch(view, /onclick=\"saveDrawHunterBet\(\$\{index\}\)\"/);
});
