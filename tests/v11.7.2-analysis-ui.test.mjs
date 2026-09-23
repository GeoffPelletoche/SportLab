import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const ff = fs.readFileSync(new URL("../ui/views/frenchflairView.js", import.meta.url), "utf8");
const nfl = fs.readFileSync(new URL("../ui/views/nflView.js", import.meta.url), "utf8");
const ffCss = fs.readFileSync(new URL("../assets/frenchflair-premium-v2.css", import.meta.url), "utf8");
const nflCss = fs.readFileSync(new URL("../assets/modules-premium-v3.css", import.meta.url), "utf8");

test("FrenchFlair keeps confidence in recommendation without duplicate metric", () => {
  assert.match(ff, /Confiance \${confidence}%/);
  assert.doesNotMatch(ff, /renderMetric\("Confiance"/);
  assert.match(ffCss, /V11\.7\.2 — Analysis UI/);
  assert.match(ffCss, /ff-team-logo/);
});

test("NFL matchup exposes teams and theoretical kickoff prominently", () => {
  assert.match(nfl, /<section class="nfl-matchup"/);
  assert.match(nfl, /<time>\${date\(m\.date\)}<\/time>/);
  assert.match(nflCss, /V11\.7\.2 — NFL Analysis UI/);
  assert.match(nflCss, /nfl-matchup__center time/);
});
