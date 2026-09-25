import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("V11.7.9 overrides late NFL grid with vertical flex layout",()=>{
 const css=fs.readFileSync("assets/modules-premium-v3.css","utf8");
 assert.match(css,/V11\.7\.9/);
 assert.match(css,/\.nfl-matchup\.nfl-matchup--vertical\s*\{[^}]*display:flex;[^}]*flex-direction:column;/s);
});

test("V11.7.9 cache-busts late NFL stylesheet and app module",()=>{
 const html=fs.readFileSync("index.html","utf8");
 assert.match(html,/modules-premium-v3\.css\?v=11\.7\.9/);
 assert.match(html,/app\.js\?v=11\.7\.(?:9|10)/);
});
