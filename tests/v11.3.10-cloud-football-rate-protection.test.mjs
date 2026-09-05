import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);

async function source(path) { return readFile(new URL(path, root), "utf8"); }

test("V11.3.10 ne bloque jusqu'à minuit que sur le code D1 explicite", async () => {
  const code = await source("core/sync/syncEngine.js");
  assert.match(code, /const isQuota = error\.code === "d1_daily_quota_exceeded"/);
  assert.doesNotMatch(code, /const isQuota = error\.code === "d1_daily_quota_exceeded" \|\|/);
  assert.match(code, /config\.lastErrorCode !== "d1_daily_quota_exceeded"/);
});

test("V11.3.10 Bridge Football applique un limiteur conservateur et remonte 429", async () => {
  const code = await source("cloudflare-worker/sportlab-api-bridge-v3.10.1.js");
  assert.match(code, /API_SPORTS_MIN_INTERVAL_MS = 275/);
  assert.match(code, /API_SPORTS_MINUTE_BUDGET = 240/);
  assert.match(code, /API_SPORTS_RATE_LIMIT/);
  assert.match(code, /status: 429/);
  assert.match(code, /scheduleApiSportsFetch/);
});

test("V11.3.10 lisse aussi les historiques côté client", async () => {
  const code = await source("core/api/footballService.js");
  assert.match(code, /HISTORY_CONCURRENCY = 2/);
  const ratePos = code.indexOf("status === 429");
  const subscriptionPos = code.indexOf("status === 403");
  assert.ok(ratePos >= 0 && subscriptionPos >= 0 && ratePos < subscriptionPos);
});

test("V11.3.10 conserve la fenêtre quotidienne à 1 jour", async () => {
  const config = await source("core/config/config.js");
  assert.match(config, /analysisWindowDays:\s*1/);
});


test("V11.3.10 persiste le fingerprint pending pour stabiliser le timestamp Sync V2", async () => {
  const code = await source("core/sync/localDataAdapter.js");
  assert.match(code, /if \(changes\.length\) saveMeta\(state\)/);
});

test("V11.3.10 ne répète pas agressivement un HTTP 429 côté navigateur", async () => {
  const { fetchFromWorker } = await import("../core/api/apiClient.js");
  const previousFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return new Response(JSON.stringify({
      error: "API_SPORTS_RATE_LIMIT",
      code: "API_SPORTS_RATE_LIMIT",
      message: "Limite temporaire",
      retryAfterMs: 1500
    }), { status: 429, headers: { "content-type": "application/json" } });
  };
  try {
    await assert.rejects(
      () => fetchFromWorker("/football/fixtures", { league: 61, from: "2026-09-05", to: "2026-09-06" }),
      error => error?.status === 429 && error?.code === "API_SPORTS_RATE_LIMIT"
    );
    assert.equal(calls, 1);
  } finally {
    globalThis.fetch = previousFetch;
  }
});
