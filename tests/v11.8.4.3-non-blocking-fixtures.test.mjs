import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("V11.8.4.4 removes the browser 10/60 start window", () => {
  const source = read("core/api/requestScheduler.js");
  assert.match(source, /if \(IS_SNAPSHOT_BUILD\) await waitForStartWindow\(\)/);
  assert.match(source, /MIN_GAP_MS = IS_SNAPSHOT_BUILD \? 5000 : 900/);
});

test("V11.8.4.4 re-evaluates priority after scheduler pauses", () => {
  const source = read("core/api/requestScheduler.js");
  const waitIndex = source.indexOf("if (waitMs > 0) await wait(waitMs)");
  const sortIndex = source.indexOf("queue.sort((a, b) => b.priority - a.priority || a.sequence - b.sequence);", waitIndex);
  const shiftIndex = source.indexOf("const item = queue.shift();", waitIndex);
  assert.ok(waitIndex >= 0 && sortIndex > waitIndex && shiftIndex > sortIndex);
});

test("V11.8.4.4 keeps fixture priority and NFL diagnostics", () => {
  const api = read("core/api/apiClient.js");
  const nfl = read("core/api/nflService.js");
  assert.match(api, /value === "\/nfl\/games"\) return 120/);
  assert.match(api, /value === "\/rugby\/fixtures"\) return 110/);
  assert.match(api, /value === "\/football\/fixtures"\) return 100/);
  assert.match(nfl, /diagnostics\.fixtureRequest/);
});
