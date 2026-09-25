import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const legacy = fs.readFileSync(new URL("../legacyApp.js", import.meta.url), "utf8");
const store = fs.readFileSync(new URL("../core/api/sportsSnapshotStore.js", import.meta.url), "utf8");
const pkg = JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"));

test("V11.8.1 is snapshot-first before network refresh", () => {
  assert.match(pkg.version, /^11\.8\.[1-9][0-9]*(?:\.[0-9]+)?$/);
  assert.match(legacy, /Promise\.all\(\[\s*readSportsSnapshot\("drawhunter"\)/);
  assert.ok(legacy.indexOf('readSportsSnapshot("drawhunter")') < legacy.indexOf('refreshDrawHunterData({ force: forceSports'));
});

test("V11.8.1 persists only successful completed payloads", () => {
  assert.match(legacy, /if \(!isErrorPayload\(payload\)\) void writeSportsSnapshot\("drawhunter", payload\)/);
  assert.match(legacy, /if \(!isErrorPayload\(payload\)\) void writeSportsSnapshot\("frenchflair", payload\)/);
  assert.match(legacy, /if \(!isErrorPayload\(payload\)\) void writeSportsSnapshot\("nfl", payload\)/);
});

test("snapshot store uses IndexedDB, atomic transactions and bounded stale fallback", () => {
  assert.match(store, /indexedDB\.open/);
  assert.match(store, /transaction\(STORE, "readwrite"\)/);
  assert.match(store, /MAX_STALE_MS = 72 \* 60 \* 60 \* 1000/);
  assert.match(store, /payload\?\.meta\?\.error === true/);
});
