import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { renderPortfolio } from "../ui/views/portfolioView.js";

test("V11.5.0 Portfolio affiche les quatre KPI financiers principaux", () => {
  const html = renderPortfolio({ statistics: { global: { placedBets: 12, settledBets: 10, profit: 25, roi: 12.5, winRate: 60 }, timeline: [] } });
  for (const label of ["Paris", "Profit net", "ROI réel", "Progression"]) assert.match(html, new RegExp(label));
  assert.match(html, /Capital de référence/);
});

test("V11.5.0 Portfolio propose les cinq périodes du graphique", () => {
  const html = renderPortfolio({ statistics: { global: {}, timeline: [{ timestamp: Date.now(), profit: 4 }] } });
  for (const label of [">7j<", ">30j<", ">3m<", ">1an<", ">Tout<"]) assert.match(html, new RegExp(label));
  assert.match(html, /Évolution du profit cumulé/);
});

test("V11.5.0 conserve les ventilations ROI historiques", () => {
  const source = fs.readFileSync(new URL("../ui/views/portfolioView.js", import.meta.url), "utf8");
  assert.match(source, /ROI par sport/);
  assert.match(source, /ROI par module/);
  assert.match(source, /ROI par compétition/);
  assert.match(source, /ROI par marché/);
});
