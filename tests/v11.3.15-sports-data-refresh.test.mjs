import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const legacy = fs.readFileSync(new URL("../legacyApp.js", import.meta.url), "utf8");
const dashboard = fs.readFileSync(new URL("../ui/views/dashboardView.js", import.meta.url), "utf8");
const drawhunter = fs.readFileSync(new URL("../ui/views/drawhunterView.js", import.meta.url), "utf8");
const frenchflair = fs.readFileSync(new URL("../ui/views/frenchflairView.js", import.meta.url), "utf8");

test("V11.3.15 sports loading is independent from navigation/bootstrap", () => {
  assert.match(legacy, /sportsRefreshPromise/);
  assert.match(legacy, /void refreshSportsData\(\{ force: forceSports/);
  assert.match(legacy, /sportlab:sports-data-updated/);
  const nav = legacy.match(/window\.navigateSportLab = function\(page\) \{[\s\S]*?\n\};/)?.[0] || "";
  assert.doesNotMatch(nav, /loadSportsApplicationData/);
});

test("V11.3.15 manual refresh really reloads sports without resetting page", () => {
  const refresh = legacy.match(/window\.refreshSportLab = async function\(\) \{[\s\S]*?\n\};/)?.[0] || "";
  assert.match(refresh, /refreshSportsData\(\{ force: true, reason: "manual" \}\)/);
  assert.doesNotMatch(refresh, /currentPage = "home"/);
  assert.doesNotMatch(refresh, /syncNow/);
});

test("V11.3.15 active views rerender after fresh sports payloads", () => {
  assert.match(legacy, /drawhunterPayload = sportsData\.drawhunterPayload/);
  assert.match(legacy, /frenchflairPayload = sportsData\.frenchflairPayload/);
  assert.match(legacy, /renderCurrentApplication\(\);/);
});

test("V11.3.15 UI distinguishes loading from a true zero-fixture result", () => {
  assert.match(dashboard, /sportsLoading/);
  assert.match(dashboard, /Chargement des rencontres/);
  assert.match(drawhunter, /meta\?\.loading/);
  assert.match(frenchflair, /meta\?\.loading/);
});
