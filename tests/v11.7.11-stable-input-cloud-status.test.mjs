import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const legacy = fs.readFileSync(new URL("../legacyApp.js", import.meta.url), "utf8");
const panel = fs.readFileSync(new URL("../core/sync/syncPanel.js", import.meta.url), "utf8");

test("analysis interaction freezes background rerenders beyond focusout", () => {
  assert.match(legacy, /protectedInteractionUntil/);
  assert.match(legacy, /Date\.now\(\) \+ 1400/);
  assert.match(legacy, /document\.addEventListener\("input"/);
  assert.match(legacy, /if \(isProtectedInteractionActive\(\)\) \{ flushDeferredRender\(\); return; \}/);
});

test("cloud red state is reserved for persistent failures", () => {
  assert.match(panel, /consecutiveErrors/);
  assert.match(panel, /persistent \? "error" : "syncing"/);
  assert.match(panel, /status = event\.status/);
});
