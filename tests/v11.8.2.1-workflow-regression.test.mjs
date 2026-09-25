import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const workflow = fs.readFileSync(new URL("../.github/workflows/pages.yml", import.meta.url), "utf8");
const pkg = JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"));

test("V11.8.2.1 ships the server-snapshot Pages workflow", () => {
  assert.match(workflow, /name: Deploy SportLab Pages \+ Server Snapshot \(V11\.8\.2\.1\)/);
  assert.match(workflow, /schedule:/);
  assert.match(workflow, /cron: "17 5,12,18 \* \* \*"/);
  assert.match(workflow, /name: Validate SportLab/);
  assert.match(workflow, /run: npm run validate/);
  assert.match(workflow, /name: Build atomic server snapshot/);
  assert.match(workflow, /run: npm run snapshot/);
  assert.ok(workflow.indexOf("Build atomic server snapshot") < workflow.indexOf("Upload artifact"));
});

test("V11.8.2.1 exposes the snapshot build command", () => {
  assert.equal(pkg.version, "11.8.2.1");
  assert.equal(pkg.scripts.snapshot, "node scripts/build-server-snapshot.mjs");
});
