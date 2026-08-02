import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { explainDrawHunterPrediction, explainBookmakerPrice } from "../core/engines/drawHunterExplainabilityEngine.js";

test("DrawHunter explique les signaux du modèle sans modifier la prédiction", () => {
  const match = {
    probability: 0.34,
    predictionStatus: "OK",
    drawProfile: 0.31,
    lowScoringProfile: 0.62,
    balance: 0.78,
    homeStats: { games: 24, effectiveGames: 17.5 },
    awayStats: { games: 22, effectiveGames: 16.8 }
  };
  const explanation = explainDrawHunterPrediction(match, 3.16);
  assert.equal(explanation.available, true);
  assert.equal(explanation.factors.length, 5);
  assert.equal(explanation.factors.some(factor => factor.key === "draw-profile"), true);
  assert.equal(explanation.factors.some(factor => factor.key === "bookmaker-price"), true);
  assert.equal(match.probability, 0.34);
});

test("le facteur bookmaker est mis en attente sans cote", () => {
  const factor = explainBookmakerPrice(0.34, null);
  assert.equal(factor.tone, "pending");
  assert.equal(factor.stars, 0);
});

test("l'interface contient le bloc Explainable AI uniquement dans DrawHunter", async () => {
  const drawView = await readFile(new URL("../ui/views/drawhunterView.js", import.meta.url), "utf8");
  const frenchView = await readFile(new URL("../ui/views/frenchflairView.js", import.meta.url), "utf8");
  assert.equal(drawView.includes("Pourquoi cette estimation ?"), true);
  assert.equal(drawView.includes("data-dh-explain-factor"), true);
  assert.equal(frenchView.includes("Explainable AI"), false);
});
