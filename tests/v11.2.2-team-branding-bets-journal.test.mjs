import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const render = fs.readFileSync(new URL("../services/renderService.js", import.meta.url), "utf8");
const bets = fs.readFileSync(new URL("../ui/views/betsView.js", import.meta.url), "utf8");
const journal = fs.readFileSync(new URL("../ui/views/journalView.js", import.meta.url), "utf8");
const store = fs.readFileSync(new URL("../core/stores/betsStore.js", import.meta.url), "utf8");

test("le rendu transmet une table de branding aux pages Paris et Journal", () => {
  assert.match(render, /buildTeamBrandingLookup/);
  assert.match(render, /renderJournal\(\s*data\.journal,\s*teamBrandingLookup/);
  assert.match(render, /renderBets\(\s*data\.dashboard\?\.bets \|\| \[\],\s*teamBrandingLookup/);
});

test("Paris et Journal utilisent les logos officiels", () => {
  assert.match(bets, /renderTeamLogo/);
  assert.match(journal, /renderTeamLogo/);
  assert.match(bets, /bet-team-matchup/);
  assert.match(journal, /journal-team-matchup/);
});

test("les nouveaux paris conservent les identifiants et logos", () => {
  assert.match(store, /homeId: bet\.homeId/);
  assert.match(store, /awayLogo: bet\.awayLogo/);
});
