import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const pages = fs.readFileSync(new URL("../.github/workflows/pages.yml", import.meta.url), "utf8");
const snapshot = fs.readFileSync(new URL("../.github/workflows/server-snapshot.yml", import.meta.url), "utf8");
const pkg = JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const builder = fs.readFileSync(new URL("../scripts/build-server-snapshot.mjs", import.meta.url), "utf8");

test("V11.8.4.13 Pages deploy is independent from API-Sports snapshot generation", () => {
  assert.match(pages, /name: Deploy SportLab Pages \(V11\.8\.4\.13\)/);
  assert.match(pages, /push:/);
  assert.doesNotMatch(pages, /schedule:/);
  assert.doesNotMatch(pages, /npm run snapshot/);
  assert.doesNotMatch(pages, /SPORTLAB_SNAPSHOT_BUILD/);
  assert.match(pages, /run: npm run validate/);
  assert.match(pages, /uses: actions\/deploy-pages@v5/);
});

test("V11.8.4.13 snapshot refresh is autonomous, conservative and publishes only the snapshot", () => {
  assert.match(snapshot, /name: Refresh Server Snapshot \(V11\.8\.4\.13\)/);
  assert.match(snapshot, /workflow_dispatch:/);
  assert.match(snapshot, /cron: "17 5,12,18 \* \* \*"/);
  assert.doesNotMatch(snapshot, /push:/);
  assert.match(snapshot, /contents: write/);
  assert.match(snapshot, /SPORTLAB_SNAPSHOT_BUILD: "1"/);
  assert.match(snapshot, /run: npm run snapshot/);
  assert.match(snapshot, /git add data\/server-snapshot\.json/);
  assert.match(snapshot, /git pull --rebase origin main/);
  assert.match(snapshot, /git push origin HEAD:main/);
  assert.match(snapshot, /uses: actions\/deploy-pages@v5/);
  assert.match(snapshot, /name: Deploy refreshed snapshot to GitHub Pages/);
});

test("V11.8.4.13 package and generated snapshot advertise the current version", () => {
  assert.equal(pkg.version, "11.8.4.13");
  assert.equal(pkg.scripts.snapshot, "node scripts/build-server-snapshot.mjs");
  assert.match(builder, /version: "11\.8\.4\.13"/);
});
