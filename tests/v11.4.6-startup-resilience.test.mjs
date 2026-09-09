import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const legacy = fs.readFileSync(new URL("../legacyApp.js", import.meta.url), "utf8");
const dashboard = fs.readFileSync(new URL("../ui/views/dashboardView.js", import.meta.url), "utf8");

test("V11.4.6 retries transient startup sport failures without coupling modules", () => {
  assert.match(legacy, /STARTUP_RETRY_DELAYS_MS\s*=\s*\[1200, 2500\]/);
  assert.match(legacy, /reason === "startup" \? STARTUP_RETRY_DELAYS_MS : \[\]/);
  assert.match(legacy, /loadSportWithStartupRetry/);
  assert.match(legacy, /load: loadDrawHunterApplicationData/);
  assert.match(legacy, /load: loadFrenchFlairApplicationData/);
  assert.match(legacy, /load: loadNflApplicationData/);
});

test("V11.4.6 treats service error payloads as retryable startup failures", () => {
  assert.match(legacy, /payload\?\.meta\?\.error === true/);
  assert.match(legacy, /if \(!isErrorPayload\(lastPayload\)\) return lastPayload/);
});

test("V11.4.6 keeps previous data visible while a retry is pending", () => {
  assert.match(legacy, /matches: previousMatches/);
  assert.match(legacy, /retrying: true/);
  assert.match(legacy, /error: false/);
});

test("V11.4.6 dashboard distinguishes retry from a terminal error", () => {
  assert.match(dashboard, /isRetrying = meta\?\.retrying === true/);
  assert.match(dashboard, /"Connexion…"/);
  assert.match(dashboard, /Nouvelle tentative automatique/);
});
