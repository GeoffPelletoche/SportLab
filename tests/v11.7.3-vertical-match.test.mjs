import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
test("FrenchFlair uses vertical match poster and concise recent bets",()=>{const v=fs.readFileSync("ui/views/frenchflairView.js","utf8");assert.match(v,/ff-match-card__teams--vertical/);assert.doesNotMatch(v,/Ta dernière mise SportLab impliquant/);});
test("NFL recent bet context removes redundant summary",()=>{const v=fs.readFileSync("ui/views/nflView.js","utf8");assert.doesNotMatch(v,/Ta dernière mise SportLab impliquant/);});
test("Mobile styles preserve two compact bet cards",()=>{const css=fs.readFileSync("assets/style.css","utf8");assert.match(css,/ff-match-card__teams--vertical/);assert.match(css,/grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);});
