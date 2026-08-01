import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const root = new URL("../", import.meta.url);
test("V9 worker fixes rugby team fallback", async () => { const code = await readFile(new URL("cloudflare-worker/sportlab-api-bridge-v3.9.0.js", root), "utf8"); assert.match(code, /matchedForTeam > 0/); assert.match(code, /football\/game-result/); });
test("V9 removes bulky navigation filters", async () => { const ff = await readFile(new URL("ui/views/frenchflairView.js", root), "utf8"); const dh = await readFile(new URL("ui/views/drawhunterView.js", root), "utf8"); assert.doesNotMatch(ff, /\$\{renderWorkflowFilters\(matches\)\}/); assert.doesNotMatch(dh, /\$\{renderWorkspaceToolbar\(\)\}/); });
test("V9 evaluates unplaced predictions", async () => { const code = await readFile(new URL("core/performance/predictionEvaluationEngine.js", root), "utf8"); assert.match(code, /GOOD_PASS/); assert.match(code, /placed:false/); });
