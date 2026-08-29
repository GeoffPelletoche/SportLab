import assert from "node:assert/strict";
import fs from "node:fs";

const css = fs.readFileSync(new URL("../assets/sportlab-v7-core.css", import.meta.url), "utf8");
const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");

assert.match(css, /input\[id\^="draw-stake-"\]/);
assert.match(css, /input\[id\^="ff-stake-"\]/);
assert.match(css, /font-size:\s*16px\s*!important/);
assert.doesNotMatch(html, /maximum-scale\s*=\s*1/i);
assert.doesNotMatch(html, /user-scalable\s*=\s*no/i);

console.log("v11.3.7 iOS stake zoom regression test passed");
