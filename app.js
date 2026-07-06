import { loadDrawHunterMatches } from "./modules/drawhunter.js";
import { loadFrenchFlairMatches } from "./modules/frenchflair.js";
import { getROI } from "./core/roiEngine.js";
import { saveBet } from "./core/betsStore.js";
import { computeValue } from "./core/valueEngine.js";

import { renderDashboard } from "./ui/dashboardView.js";
import { renderDrawHunter } from "./ui/drawhunterView.js";
import { renderFrenchFlair } from "./ui/frenchflairView.js";
import { renderPortfolio } from "./ui/portfolioView.js";

let drawhunterPayload = null;
let frenchflairPayload = null;

async function init() {
  const app = document.getElementById("app");

  try {
    app.innerHTML = `<h1>🏟️ SportLab</h1><p>Chargement...</p>`;

    drawhunterPayload = await loadDrawHunterMatches();
    frenchflairPayload = await loadFrenchFlairMatches();

    const roi = getROI();

    app.innerHTML = renderDashboard({
      drawhunterHtml: renderDrawHunter(drawhunterPayload),
      frenchflairHtml: renderFrenchFlair(frenchflairPayload),
      portfolioHtml: renderPortfolio(roi)
    });

  } catch (error) {
    console.error("SportLab init error:", error);

    app.innerHTML = `
      <h1>🏟️ SportLab</h1>
      <section class="card">
        <h2>Erreur de chargement</h2>
        <p>${error.message}</p>
      </section>
    `;
  }
}

window.saveDrawHunterBet = function(index) {
  const match = drawhunterPayload?.matches?.[index];

  if (!match) {
    alert("Match introuvable.");
    return;
  }

  const placed = document.getElementById(`draw-placed-${index}`)?.checked;
  const stake = Number(document.getElementById(`draw-stake-${index}`)?.value || 0);

  if (placed && stake <= 0) {
    alert("Saisis un montant misé valide.");
    return;
  }

  const saved = saveBet({
    source: "DrawHunter",
    sport: "football",
    competition: match.competition,
    match: `${match.home} vs ${match.away}`,
    market: "DRAW",
    line: null,
    odds: match.odds,
    probability: match.probability,
    value: match.value,
    edge: match.edge,
    decision: match.decision,
    placed,
    stake
  });

  alert(
    saved.placed
      ? "Pari DrawHunter sauvegardé en attente."
      : "Analyse DrawHunter sauvegardée en non placé."
  );

  init();
};

window.analyzeFrenchFlairValue = function(index) {
  const match = frenchflairPayload?.matches?.[index];

  if (!match) {
    alert("Match introuvable.");
    return;
  }

  if (match.analysisStatus !== "OK") {
    alert("Analyse indisponible : statistiques insuffisantes.");
    return;
  }

  const line = Number(document.getElementById(`ff-line-${index}`)?.value || 0);
  const odds = Number(document.getElementById(`ff-odds-${index}`)?.value || 0);

  if (line <= 0 || odds <= 1) {
    alert("Saisis une ligne bookmaker et une cote valide.");
    return;
  }

  const probability = Number(match.confidence || 0) / 100;

  const value = computeValue({
    probability,
    odds,
    minValue: 0.01
  });

  const resultBox = document.getElementById(`ff-result-${index}`);

  resultBox.innerHTML = `
    <hr/>

    <p>Marché analysé : <strong>${match.trend}</strong></p>
    <p>Ligne bookmaker : ${line}</p>
    <p>Cote : ${odds}</p>

    <p>Probabilité modèle : ${(value.probability * 100).toFixed(1)}%</p>
    <p>Probabilité implicite : ${(value.impliedProbability * 100).toFixed(1)}%</p>
    <p>Value : ${(value.value * 100).toFixed(1)}%</p>
    <p>Edge : ${(value.edge * 100).toFixed(1)}%</p>

    <span class="badge ${value.decision === "VALUE BET" ? "badge-value" : "badge-no"}">
      ${value.decision}
    </span>

    ${value.decision === "VALUE BET" ? `
      <hr/>

      <label>
        <input type="checkbox" id="ff-placed-${index}">
        Pari placé
      </label>

      <br/><br/>

      <label>
        Montant misé
        <input id="ff-stake-${index}" type="number" min="0" step="0.01" placeholder="Ex : 10">
      </label>

      <br/><br/>

      <button onclick="saveFrenchFlairBet(${index}, ${line}, ${odds})">
        Valider le pari
      </button>
    ` : `
      <hr/>
      <p class="small">Statut : NON_PLACED</p>
    `}
  `;
};

window.saveFrenchFlairBet = function(index, line, odds) {
  const match = frenchflairPayload?.matches?.[index];

  if (!match) {
    alert("Match introuvable.");
    return;
  }

  const placed = document.getElementById(`ff-placed-${index}`)?.checked;
  const stake = Number(document.getElementById(`ff-stake-${index}`)?.value || 0);

  if (placed && stake <= 0) {
    alert("Saisis un montant misé valide.");
    return;
  }

  const probability = Number(match.confidence || 0) / 100;

  const value = computeValue({
    probability,
    odds,
    minValue: 0.01
  });

  const saved = saveBet({
    source: "FrenchFlair",
    sport: "rugby",
    competition: match.competition,
    match: `${match.home} vs ${match.away}`,
    market: match.trend,
    line,
    odds,
    probability: value.probability,
    value: value.value,
    edge: value.edge,
    decision: value.decision,
    placed,
    stake
  });

  alert(
    saved.placed
      ? "Pari FrenchFlair sauvegardé en attente."
      : "Analyse FrenchFlair sauvegardée en non placé."
  );

  init();
};

init();