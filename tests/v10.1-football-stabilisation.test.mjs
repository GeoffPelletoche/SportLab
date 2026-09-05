import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);

test("V10.1 worker adds season to football fixtures", async () => {
  const code = await readFile(new URL("cloudflare-worker/sportlab-api-bridge-v3.10.1.js", root), "utf8");
  assert.match(code, /getCurrentFootballSeason\(env, league\)/);
  assert.match(code, /&season=\$\{encodeURIComponent\(season\)\}/);
  assert.match(code, /status: normalized\.length > 0 \? "OK" : "EMPTY"/);
});

test("V10.1 diagnostics distinguish empty from errors", async () => {
  const service = await readFile(new URL("core/api/footballService.js", root), "utf8");
  const view = await readFile(new URL("ui/views/diagnosticsView.js", root), "utf8");
  assert.match(service, /status = enrichedFixtures\.length > 0 \? "OK" : "EMPTY"/);
  assert.match(view, /Compétitions sans match/);
  assert.match(view, /Détail par compétition/);
});
