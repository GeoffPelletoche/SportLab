import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("V11.8.4.7 matches snapshots by stable identity when fixture IDs change", () => {
  for (const file of ["core/api/nflService.js", "core/api/rugbyService.js", "core/api/footballService.js"]) {
    const source = read(file);
    assert.match(source, /previousByIdentity/);
    assert.match(source, /findPreviousMatch\(fixture, previousById, previousByIdentity\)/);
    assert.match(source, /previousByIdentity\.get\(matchIdentity\(fixture\)\)/);
    assert.match(source, /const dateRaw = match\.date \|\| match\.matchDate/);
    assert.match(source, /return `\$\{league\}\|\$\{home\}\|\$\{away\}\|\$\{date\}`/);
  }
});

test("V11.8.4.7 uses the same stable identity for new-match diagnostics", () => {
  for (const file of ["core/api/nflService.js", "core/api/rugbyService.js", "core/api/footballService.js"]) {
    const source = read(file);
    assert.match(source, /newMatches[^=]*= (?:allFixtures|cacheHydrated)\.filter\(match => !findPreviousMatch\(match, previousById, previousByIdentity\)\)\.length/);
  }
});

test("V11.8.4.7 keeps history fetches conditional on missing hydrated history", () => {
  for (const file of ["core/api/nflService.js", "core/api/rugbyService.js", "core/api/footballService.js"]) {
    const source = read(file);
    assert.match(source, /fixture\.homeHistory\?\.length \? fixture\.homeHistory : await fetchTeamHistory/);
    assert.match(source, /fixture\.awayHistory\?\.length \? fixture\.awayHistory : await fetchTeamHistory/);
  }
});
