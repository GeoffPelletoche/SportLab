import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("V8.0.1 retire les grands blocs de contrôle des deux modules", async () => {
  const ff = await readFile(new URL("../ui/views/frenchflairView.js", import.meta.url), "utf8");
  const dh = await readFile(new URL("../ui/views/drawhunterView.js", import.meta.url), "utf8");
  assert.equal(ff.includes("${renderWorkflowFilters(matches)}"), false);
  assert.equal(dh.includes("${renderWorkspaceToolbar()}"), false);
  assert.equal(dh.includes("${renderFilters(matches)}"), false);
});

test("V8.0.1 conserve une reprise d'historique locale", async () => {
  const rugby = await readFile(new URL("../core/api/rugbyService.js", import.meta.url), "utf8");
  const football = await readFile(new URL("../core/api/footballService.js", import.meta.url), "utf8");
  assert.match(rugby, /readHistoryCache/);
  assert.match(rugby, /cacheFallback/);
  assert.match(football, /readHistoryCache/);
  assert.match(football, /cacheFallback/);
});

test("V8.0.1 expose des diagnostics métier", async () => {
  const diagnostic = await readFile(new URL("../services/diagnosticService.js", import.meta.url), "utf8");
  assert.match(diagnostic, /buildApplicationDiagnostic/);
  assert.match(diagnostic, /matchesLoaded/);
  assert.match(diagnostic, /syncErrors/);
});
