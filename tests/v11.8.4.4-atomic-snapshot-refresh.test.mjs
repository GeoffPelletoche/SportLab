import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const legacy = fs.readFileSync(new URL("../legacyApp.js", import.meta.url), "utf8");

test("V11.8.4.4 stages progress without replacing active sport payloads", () => {
  assert.match(legacy, /function recordSportRefreshProgress/);
  assert.doesNotMatch(legacy, /publishProgress:\s*progressPayload\s*=>\s*publishSportPayload\("drawhunter"/);
  assert.doesNotMatch(legacy, /publishProgress:\s*progressPayload\s*=>\s*publishSportPayload\("frenchflair"/);
  assert.doesNotMatch(legacy, /publishProgress:\s*progress\s*=>\s*publishSportPayload\("nfl"/);
  assert.match(legacy, /publishProgress:\s*progress\s*=>\s*recordSportRefreshProgress\("nfl"/);
});

test("V11.8.4.4 preserves last-known-good payload on refresh error", () => {
  assert.match(legacy, /function atomicRefreshFailurePayload/);
  assert.match(legacy, /atomicRefreshFailurePayload\(drawhunterPayload, payload, "football"\)/);
  assert.match(legacy, /atomicRefreshFailurePayload\(frenchflairPayload, payload, "rugby"\)/);
  assert.match(legacy, /atomicRefreshFailurePayload\(nflPayload, payload, "nfl"\)/);
});
