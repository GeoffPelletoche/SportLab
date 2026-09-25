import test from "node:test";
import assert from "node:assert/strict";
import { readServerSportsSnapshot, serverPayloadForDisplay } from "../core/api/serverSportsSnapshot.js";

test("V11.8.2 accepts a fresh server snapshot", async () => {
  const generatedAt = new Date(Date.now() - 1000).toISOString();
  const snapshot = await readServerSportsSnapshot({ fetchImpl: async () => ({ ok:true, json:async()=>({schemaVersion:1,generatedAt,sports:{frenchflair:{matches:[{id:1}],meta:{}}}}) }) });
  assert.ok(snapshot); assert.equal(snapshot.sports.frenchflair.matches.length,1);
});
test("V11.8.2 rejects a stale server snapshot", async () => {
  const generatedAt = new Date(Date.now() - 73*60*60*1000).toISOString();
  const snapshot = await readServerSportsSnapshot({ fetchImpl: async () => ({ ok:true, json:async()=>({schemaVersion:1,generatedAt,sports:{}}) }) });
  assert.equal(snapshot,null);
});
test("V11.8.2 marks server payload distinctly", () => {
  const payload=serverPayloadForDisplay({generatedAt:new Date().toISOString(),ageMs:123,sports:{nfl:{matches:[{id:7}],meta:{}}}},"nfl");
  assert.equal(payload.meta.serverSnapshot,true); assert.equal(payload.meta.snapshot,true); assert.equal(payload.matches.length,1);
});
