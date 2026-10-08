import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("V11.8.4.8 exposes a startup fixture cooldown that manual refresh bypasses", () => {
  const source = read("core/api/fixtureRefreshPolicy.js");
  assert.match(source, /STARTUP_FIXTURE_COOLDOWN_MS = 10 \* 60 \* 1000/);
  assert.match(source, /refreshMode === "manual" \|\| refreshMode === "force"/);
  assert.match(source, /meta\.snapshotStale === true/);
});

test("V11.8.4.8 passes previous payload and refresh mode through the module pipeline", () => {
  for (const file of ["legacyApp.js", "modules/nfl.js", "modules/frenchflair.js", "modules/drawhunter.js"]) {
    assert.match(read(file), /previousPayload/);
    assert.match(read(file), /refreshMode/);
  }
});

test("V11.8.4.8 services can skip a recent snapshot without entering fixture/history calls", () => {
  for (const file of ["core/api/nflService.js", "core/api/rugbyService.js", "core/api/footballService.js"]) {
    const source = read(file);
    assert.match(source, /shouldSkipFixtureRefresh\(\{ previousPayload, refreshMode \}\)/);
    assert.match(source, /phase: "fixture-cooldown"/);
  }
});
