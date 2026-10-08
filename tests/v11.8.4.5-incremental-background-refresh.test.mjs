import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = p => fs.readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("V11.8.4.6 passes the active snapshot into background sport loaders", () => {
  const app = read("legacyApp.js");
  assert.match(app, /previousMatches:\s*Array\.isArray\(previousPayload\?\.matches\)/);
});

test("V11.8.4.6 reuses complete snapshot histories before API history calls", () => {
  for (const file of ["core/api/nflService.js", "core/api/rugbyService.js", "core/api/footballService.js"]) {
    const source = read(file);
    assert.match(source, /previousById/);
    assert.match(source, /previousHome\.length \? previousHome/);
    assert.match(source, /previousAway\.length \? previousAway/);
  }
});

test("V11.8.4.6 preserves atomic staging", () => {
  const app = read("legacyApp.js");
  assert.match(app, /recordSportRefreshProgress/);
  assert.doesNotMatch(app, /publishProgress:\s*progress[^\n]*publishSportPayload/);
});
