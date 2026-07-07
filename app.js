import { loadDrawHunterMatches } from "./modules/drawhunter.js";
import { loadFrenchFlairMatches } from "./modules/frenchflair.js";
import { getROI } from "./core/roiEngine.js";
import { saveBet } from "./core/betsStore.js";
import { computeValue } from "./core/valueEngine.js";
import { saveAnalysis, getAnalysisForMatch } from "./core/analysisStore.js";

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

    const message =
      error?.message ||
      String(error) ||
      "Erreur inconnue au chargement de SportLab.";

    app.innerHTML = `
      <h1>🏟️ SportLab</h1>
      <section class="card">
        <h2>Erreur de chargement</h2>
        <p>${message}</p>
      </section>
    `;
  }
}

/**
 * DRAWHUNTER
 */
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

  alert(saved.placed ? "Pari DrawHunter sauvegardé." : "Analyse DrawHunter sauvegardée.");
  init();
};

/**
 * FRENCHFLAIR — OUVERTURE FICHE MANUELLE
 */
window.analyzeFrenchFlairValue = function(matchId) {
  const match = getFrenchFlairMatchById(matchId);
  
  if (!match) {
    alert("Match introuvable.");
    return;
  }

  const existing = getAnalysisForMatch(match.id);
  const box = document.getElementById(`ff-result-${index}`);

  if (!box) return;

  box.innerHTML = `
    <hr/>

    <h3>Analyse FrenchFlair</h3>

    <label>
      Marché
      <select id="ff-market-${index}">
        <option value="OVER" ${existing?.market === "OVER" ? "selected" : ""}>Over</option>
        <option value="UNDER" ${existing?.market === "UNDER" ? "selected" : ""}>Under</option>
      </select>
    </label>

    <label>
      Ligne bookmaker
      <input id="ff-line-${index}" type="number" step="0.5" placeholder="Ex : 45.5" value="${existing?.line ?? ""}">
    </label>

    <label>
      Bookmaker
      <input id="ff-bookmaker-${index}" type="text" placeholder="Ex : Betclic" value="${existing?.bookmaker ?? ""}">
    </label>

    <label>
      Cote
      <input id="ff-odds-${index}" type="number" step="0.01" placeholder="Ex : 1.90" value="${existing?.odds || ""}">
    </label>

    <label>
      Notes
      <input id="ff-notes-${index}" type="text" placeholder="Observation personnelle" value="${existing?.notes ?? ""}">
    </label>

    <button onclick="calculateFrenchFlairAnalysis('${match.id}')">
      Calculer la value
    </button>

    <div id="ff-calculation-${index}" style="margin-top:12px;"></div>
  `;
};

/**
 * FRENCHFLAIR — CALCUL VALUE
 */
window.calculateFrenchFlairAnalysis = function(matchId) {
  const match = getFrenchFlairMatchById(matchId);
  
  if (!match) {
    alert("Match introuvable.");
    return;
  }

  const market = document.getElementById(`ff-market-${index}`)?.value;
  const line = Number(document.getElementById(`ff-line-${index}`)?.value || 0);
  const bookmaker = document.getElementById(`ff-bookmaker-${index}`)?.value || "";
  const odds = Number(document.getElementById(`ff-odds-${index}`)?.value || 0);
  const probability = computeFrenchFlairProbability(match, market, line);
  const probabilityPercent = probability * 100;
  console.log("FF probability debug", {
    matchId: match.id,
    predictedTotalPoints: match.predictedTotalPoints,
    sigma: match.sigma,
    market,
    line,
    probability
  });
  const notes = document.getElementById(`ff-notes-${index}`)?.value || "";

  if (!market || line <= 0 || odds <= 1) {
  alert("Saisis un marché, une ligne bookmaker et une cote valides.");
  return;
}

if (!Number.isFinite(probability) || probability <= 0) {
  alert("Probabilité automatique indisponible : sigma ou total prédit manquant.");
  return;
}

  const value = computeValue({
    probability,
    odds,
    minValue: 0.01
  });

  const predictedTotal = Number(match.predictedTotalPoints || 0);
  const modelEdgePoints = market === "OVER"
    ? predictedTotal - line
    : line - predictedTotal;

  const modelEdgePercent = line > 0
    ? (modelEdgePoints / line) * 100
    : 0;

  const analysis = saveAnalysis({
    source: "FrenchFlair",
    sport: "rugby",
    competition: match.competition,
    matchId: match.id,
    match: `${match.home} vs ${match.away}`,
    home: match.home,
    away: match.away,
    date: match.date,

    market,
    line,
    bookmaker,
    odds,
    probability,
    impliedProbability: value.impliedProbability,
    value: value.value,
    edge: value.edge,
    decision: value.decision,

    predictedTotalPoints: predictedTotal,
    modelEdgePoints,
    modelEdgePercent,

    status: "draft",
    notes
  });

  const box = document.getElementById(`ff-calculation-${index}`);

  box.innerHTML = `
    <hr/>

    <p>Marché analysé : <strong>${market} ${line}</strong></p>
    <p>Bookmaker : ${bookmaker || "-"}</p>
    <p>Cote : ${odds}</p>

    <hr/>

    <p>Total prédit SportLab : <strong>${predictedTotal.toFixed(1)} pts</strong></p>
    <p>Ligne bookmaker : ${line.toFixed(1)} pts</p>
    <p>Écart modèle / bookmaker : <strong>${modelEdgePoints >= 0 ? "+" : ""}${modelEdgePoints.toFixed(1)} pts</strong></p>
    <p>Écart relatif : <strong>${modelEdgePercent >= 0 ? "+" : ""}${modelEdgePercent.toFixed(1)}%</strong></p>

    <hr/>

    <p>Probabilité estimée : ${probabilityPercent.toFixed(1)}%</p>
    <p>Probabilité implicite : ${(value.impliedProbability * 100).toFixed(1)}%</p>
    <p>Value : ${(value.value * 100).toFixed(1)}%</p>
    <p>Edge : ${(value.edge * 100).toFixed(1)}%</p>

    <span class="badge ${value.decision === "VALUE BET" ? "badge-value" : "badge-no"}">
      ${value.decision}
    </span>

    <p class="small">Analyse sauvegardée automatiquement.</p>

    ${value.decision === "VALUE BET" ? `
      <hr/>

      <label>
        <input type="checkbox" id="ff-placed-${index}">
        Pari placé
      </label>

      <label>
        Montant misé
        <input id="ff-stake-${index}" type="number" min="0" step="0.01" placeholder="Ex : 10">
      </label>

      <button onclick="saveFrenchFlairBet(${index}, '${analysis.id}')">
        Sauvegarder le pari
      </button>
    ` : ""}
  `;
};

/**
 * FRENCHFLAIR — SAUVEGARDE PARI
 */
window.saveFrenchFlairBet = function(index, analysisId) {
  const match = frenchflairPayload?.matches?.[index];
  const analysis = getAnalysisForMatch(match?.id);

  if (!match || !analysis) {
    alert("Analyse introuvable.");
    return;
  }

  const placed = document.getElementById(`ff-placed-${index}`)?.checked;
  const stake = Number(document.getElementById(`ff-stake-${index}`)?.value || 0);

  if (placed && stake <= 0) {
    alert("Saisis un montant misé valide.");
    return;
  }

  saveAnalysis({
    ...analysis,
    placed,
    stake,
    status: placed ? "betPlaced" : "completed"
  });

  saveBet({
    source: "FrenchFlair",
    sport: "rugby",
    competition: match.competition,
    match: `${match.home} vs ${match.away}`,
    market: `${analysis.market} ${analysis.line}`,
    line: analysis.line,
    odds: analysis.odds,
    probability: analysis.probability,
    value: analysis.value,
    edge: analysis.edge,
    decision: analysis.decision,
    placed,
    stake
  });

  alert("Analyse FrenchFlair sauvegardée.");
  init();
};

function computeFrenchFlairProbability(match, market, line) {
  const mean = Number(match.predictedTotalPoints || 0);
  const sigma = Number(match.sigma || 0);

  if (!mean || !sigma || sigma <= 0 || !line) {
    return 0;
  }

  const z = (line - mean) / sigma;
  const overProbability = 1 - normalCdf(z);

  if (market === "OVER") {
    return clamp(overProbability, 0.01, 0.99);
  }

  return clamp(1 - overProbability, 0.01, 0.99);
}

function normalCdf(x) {
  return 0.5 * (1 + erf(x / Math.sqrt(2)));
}

function erf(x) {
  const sign = x >= 0 ? 1 : -1;
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const absX = Math.abs(x);
  const t = 1 / (1 + p * absX);

  const y =
    1 -
    (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) *
    t *
    Math.exp(-absX * absX);

  return sign * y;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getFrenchFlairMatchById(matchId) {
  return frenchflairPayload?.matches?.find(
    match => String(match.id) === String(matchId)
  ) || null;
}

init();
