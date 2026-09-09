import test from "node:test"; import assert from "node:assert/strict";
import { predictNflMatch } from "../core/engines/nflTotalsPredictionEngine.js";
const hist=(isHome,base)=>Array.from({length:12},(_,i)=>({date:new Date(Date.UTC(2026,7,30-i*7)).toISOString(),status:"FT",pointsFor:base+(i%5),pointsAgainst:20+(i%4),isHome}));
test("NFL Totals produit total, sigma et confiance",()=>{const p=predictNflMatch({homeHistory:hist(true,25),awayHistory:hist(false,22)}); assert.equal(p.predictionStatus,"OK"); assert.ok(p.predictedTotalPoints>0); assert.ok(p.sigma>0); assert.ok(p.confidence>=35); assert.equal(p.modelVersion,"NFL-TOTALS-11.4.1");});
test("Settlement engine supporte NFL",async()=>{const text=await (await import("node:fs/promises")).readFile(new URL("../core/engines/betSettlementEngine.js",import.meta.url),"utf8"); assert.match(text,/\"nfl\"/); assert.match(text,/\/nfl\/game-result/);});
test("UI NFL expose analyse VALUE",async()=>{const text=await (await import("node:fs/promises")).readFile(new URL("../ui/views/nflView.js",import.meta.url),"utf8"); assert.match(text,/analyzeNflValue/); assert.match(text,/Total modèle/);});
