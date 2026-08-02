import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("V11.1.2 utilise sportlab_bets_v3 comme source canonique", () => {
  const source = read("core/stores/betsStore.js");
  assert.match(source, /BETS_STORAGE_KEY\s*=\s*"sportlab_bets_v3"/);
  assert.match(source, /LEGACY_STORAGE_KEYS/);
  assert.match(source, /deduplicateBets/);
});

test("V11.1.2 ajoute au Journal les paris sans analyse correspondante", () => {
  const source = read("services/journalService.js");
  assert.match(source, /orphanBetEntries/);
  assert.match(source, /createJournalEntryFromBet/);
  assert.match(source, /matchedBetIds/);
});

test("V11.1.2 expose le contrôle d'intégrité du Bet Store", () => {
  const store = read("core/stores/betsStore.js");
  const diagnostics = read("services/diagnosticService.js");
  assert.match(store, /export function getBetStoreHealth/);
  assert.match(diagnostics, /betStore:\s*getBetStoreHealth\(\)/);
});
