import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("FrenchFlair exposes recent bet context for both teams",()=>{const s=fs.readFileSync("ui/views/frenchflairView.js","utf8");assert.match(s,/Derniers paris des équipes/);assert.match(s,/Aucun pari précédent/);assert.match(s,/homeId/);assert.match(s,/awayId/);});
test("NFL Totals exposes recent bet context for both teams",()=>{const s=fs.readFileSync("ui/views/nflView.js","utf8");assert.match(s,/Derniers paris des équipes/);assert.match(s,/Aucun pari précédent/);assert.match(s,/findLatestNflTeamBet/);});
test("Recent bet context remains informational",()=>{const ff=fs.readFileSync("ui/views/frenchflairView.js","utf8");const nfl=fs.readFileSync("ui/views/nflView.js","utf8");assert.match(ff,/n’interviennent ni dans la VALUE ni dans le calcul de la mise actuelle/);assert.match(nfl,/n’interviennent ni dans la VALUE ni dans le calcul de la mise actuelle/);});
