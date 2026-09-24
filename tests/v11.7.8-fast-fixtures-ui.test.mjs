import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const rugby = fs.readFileSync(new URL("../core/api/rugbyService.js", import.meta.url), "utf8");
const football = fs.readFileSync(new URL("../core/api/footballService.js", import.meta.url), "utf8");
const nfl = fs.readFileSync(new URL("../ui/views/nflView.js", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../assets/style.css", import.meta.url), "utf8");
const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");

test("V11.7.8 queues all rugby fixtures before history enrichment", () => {
  assert.match(rugby, /Promise\.all\(activeCompetitions\.map/);
  assert.match(rugby, /Phase 2 seulement/);
  assert.match(rugby, /Bunnings NPC/);
});

test("V11.7.8 queues all football fixtures before history enrichment", () => {
  assert.match(football, /Promise\.all\(activeCompetitions\.map/);
  assert.match(football, /Fixtures First/);
});

test("V11.7.8 NFL uses FrenchFlair-style home VS away and visible kickoff", () => {
  assert.match(nfl, /class="nfl-kickoff"/);
  assert.match(nfl, /<span>VS<\/span>/);
  assert.match(nfl, /nfl-team nfl-team--away/);
});

test("V11.7.8 improves poster contrast and cache-busts Safari CSS", () => {
  assert.match(css, /V11\.7\.8 — Fast Fixtures/);
  assert.match(css, /rgba\(13,47,39,.72\)/);
  assert.match(html, /style\.css\?v=11\.7\.8/);
});
