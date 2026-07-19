import { loadDrawHunterMatches } from "./modules/drawhunter.js";
import { loadFrenchFlairMatches } from "./modules/frenchflair.js";
import { getROI } from "./core/roiEngine.js";
import { saveBet } from "./core/betsStore.js";
import { computeValue } from "./core/valueEngine.js";
import { saveAnalysis, getAnalysisForMatch } from "./core/analysisStore.js";
import { getAnalyses } from "./core/analysisStore.js";
import { renderJournal } from "./ui/journalView.js";
import { renderDashboard } from "./ui/dashboardView.js";
import { renderDrawHunter } from "./ui/drawhunterView.js";
import { renderFrenchFlair } from "./ui/frenchflairView.js";
import { renderPortfolio } from "./ui/portfolioView.js";
import { renderNavigation } from "./ui/navigationView.js";
import { getBets } from "./core/betsStore.js";
import { renderBets } from "./ui/betsView.js";
import { settlePendingBets } from "./core/betSettlementEngine.js";

let drawhunterPayload = null;
let frenchflairPayload = null;
const pendingFrenchFlairAnalyses = new Map();
let currentPage = "home";

async function runSettlementDiagnostics() {
  try {
    const reports = await settlePendingBets();

    localStorage.setItem(
      "sportlab_settlement_debug",
      JSON.stringify(
        {
          checkedAt: new Date().toISOString(),
          reports
        },
        null,
        2
      )
    );

    console.log(
      "[Settlement] Rapport complet :",
      reports
    );

    return reports;
  } catch (error) {
    const debugError = {
      checkedAt: new Date().toISOString(),
      error:
        error instanceof Error
          ? error.message
          : String(error)
    };

    localStorage.setItem(
      "sportlab_settlement_debug",
      JSON.stringify(debugError, null, 2)
    );

    console.error(
      "[Settlement] Erreur globale :",
      error
    );

    return [];
  }
}

async function init() {
  const app = document.getElementById("app");
  

  try {
    app.innerHTML = `<h1>🏟️ SportLab</h1><p>Chargement...</p>`;

    drawhunterPayload = await loadDrawHunterMatches();
    frenchflairPayload = await loadFrenchFlairMatches();

    const roi = getROI();
    const analyses = getAnalyses();
    const navigationHtml = renderNavigation(currentPage);
    const bets = getBets();
    
    app.innerHTML = renderDashboard({
      drawhunterHtml: renderDrawHunter(drawhunterPayload),
      frenchflairHtml: renderFrenchFlair(frenchflairPayload),
      portfolioHtml: renderPortfolio(roi),
      journalHtml: renderJournal(analyses),
      activePage: currentPage,
      navigationHtml,
      betsHtml: renderBets(bets)
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

  const placed = document.getElementById(`draw-placed-${match.id}`)?.checked;
  const stake = Number(document.getElementById(`draw-stake-${match.id}`)?.value || 0);

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
  const box = document.getElementById(`ff-result-${match.id}`);

  if (!box) return;

  box.innerHTML = `
    <hr/>

    <h3>Analyse FrenchFlair</h3>

    <label>
      Marché
      <select id="ff-market-${match.id}">
        <option value="OVER" ${existing?.market === "OVER" ? "selected" : ""}>Over</option>
        <option value="UNDER" ${existing?.market === "UNDER" ? "selected" : ""}>Under</option>
      </select>
    </label>

    <label>
      Ligne bookmaker
      <input id="ff-line-${match.id}" type="number" step="0.5" placeholder="Ex : 45.5" value="${existing?.line ?? ""}">
    </label>

    <label>
      Cote
      <input id="ff-odds-${match.id}" type="number" step="0.01" placeholder="Ex : 1.90" value="${existing?.odds || ""}">
    </label>

    <label>
      Notes
      <input id="ff-notes-${match.id}" type="text" placeholder="Observation personnelle" value="${existing?.notes ?? ""}">
    </label>

    <button onclick="calculateFrenchFlairAnalysis('${match.id}')">
      Calculer la value
    </button>

    <div id="ff-calculation-${match.id}" style="margin-top:12px;"></div>
  `;
};

/**
 * FRENCHFLAIR — CALCUL AUTOMATIQUE DE LA VALUE
 *
 * Le calcul ne sauvegarde rien immédiatement.
 * L’utilisateur peut modifier la ligne ou la cote,
 * puis sauvegarder volontairement l’analyse.
 */
window.calculateFrenchFlairAnalysis = function(matchId) {
  const match = getFrenchFlairMatchById(matchId);

  if (!match) {
    alert("Match introuvable.");
    return;
  }

  const market =
    document.getElementById(`ff-market-${match.id}`)?.value ||
    match.recommendedTrend ||
    "OVER";

  const line = Number(
    document.getElementById(`ff-line-${match.id}`)?.value || 0
  );

  const odds = Number(
    document.getElementById(`ff-odds-${match.id}`)?.value || 0
  );

  const notes =
    document.getElementById(`ff-notes-${match.id}`)?.value || "";

  if (!market || line <= 0 || odds <= 1) {
    alert("Saisis une ligne bookmaker et une cote valides.");
    return;
  }

  const predictedTotal = Number(match.predictedTotalPoints || 0);
  const sigma = Number(match.sigma || 0);
  const confidence = Number(match.confidence || 0);

  if (
    !Number.isFinite(predictedTotal) ||
    predictedTotal <= 0 ||
    !Number.isFinite(sigma) ||
    sigma <= 0
  ) {
    alert(
      "Calcul indisponible : le total prédit ou le sigma est manquant."
    );
    return;
  }

  /*
   * Probabilité automatiquement calculée à partir :
   * - du total prédit ;
   * - du sigma ;
   * - de la ligne bookmaker ;
   * - du marché Over ou Under.
   */
  const probability = computeFrenchFlairProbability(
    match,
    market,
    line
  );

  if (!Number.isFinite(probability) || probability <= 0) {
    alert("La probabilité automatique n’a pas pu être calculée.");
    return;
  }

  const probabilityPercent = probability * 100;

  /*
   * Value mathématique :
   * probabilité SportLab comparée à la probabilité implicite de la cote.
   */
  const value = computeValue({
    probability,
    odds,
    minValue: 0.01
  });

  /*
   * Écart entre la prédiction SportLab et la ligne bookmaker.
   * Un écart positif va dans le sens du marché sélectionné.
   */
  const modelEdgePoints =
    market === "OVER"
      ? predictedTotal - line
      : line - predictedTotal;

  const modelEdgePercent =
    line > 0
      ? (modelEdgePoints / line) * 100
      : 0;

  /*
   * Score Value SportLab :
   * - écart modèle/bookmaker : 40 %
   * - confiance : 20 %
   * - sigma : 20 %
   * - value mathématique : 20 %
   */
  const scoreValue = computeFrenchFlairScore({
    modelEdgePercent,
    confidence,
    sigma,
    predictedTotal,
    mathValue: value.value
  });

  const finalDecision =
    scoreValue >= 70
      ? "VALUE"
      : "NO VALUE";

  /*
   * Brouillon temporaire.
   * Rien n’est encore enregistré dans analysisStore.
   */
  const analysis = {
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
    bookmaker: "",
    odds,

    probability,
    impliedProbability: value.impliedProbability,
    value: value.value,
    edge: value.edge,
    decision: value.decision,

    predictedHomePoints: Number(match.predictedHomePoints || 0),
    predictedAwayPoints: Number(match.predictedAwayPoints || 0),
    predictedTotalPoints: predictedTotal,

    modelEdgePoints,
    modelEdgePercent,

    sigma,
    confidence,
    recommendedTrend: match.recommendedTrend || null,

    scoreValue,
    finalDecision,

    placed: false,
    stake: 0,
    status: "draft",
    notes
  };

  /*
   * Mémorisation temporaire jusqu’au clic sur :
   * "Sauvegarder l’analyse" ou "Sauvegarder le pari".
   */
  pendingFrenchFlairAnalyses.set(
    String(match.id),
    analysis
  );

  const box = document.getElementById(
    `ff-calculation-${match.id}`
  );

  if (!box) {
    alert("Zone de résultat introuvable.");
    return;
  }

  const decisionClass =
    finalDecision === "VALUE"
      ? "badge-value"
      : "badge-no";

  box.innerHTML = `
    <hr/>

    <p>
      Marché analysé :
      <strong>${market} ${line.toFixed(1)}</strong>
    </p>

    <p>
      Cote :
      <strong>${odds.toFixed(2)}</strong>
    </p>

    <hr/>

    <p>
      Total prédit SportLab :
      <strong>${predictedTotal.toFixed(1)} pts</strong>
    </p>

    <p>
      Ligne bookmaker :
      ${line.toFixed(1)} pts
    </p>

    <p>
      Écart modèle / bookmaker :
      <strong>
        ${modelEdgePoints >= 0 ? "+" : ""}
        ${modelEdgePoints.toFixed(1)} pts
      </strong>
    </p>

    <p>
      Écart relatif :
      <strong>
        ${modelEdgePercent >= 0 ? "+" : ""}
        ${modelEdgePercent.toFixed(1)}%
      </strong>
    </p>

    <hr/>

    <p>
      Probabilité SportLab :
      ${probabilityPercent.toFixed(1)}%
    </p>

    <p>
      Probabilité implicite :
      ${(value.impliedProbability * 100).toFixed(1)}%
    </p>

    <p>
      Value mathématique :
      ${(value.value * 100).toFixed(1)}%
    </p>

    <p>
      Edge :
      ${(value.edge * 100).toFixed(1)}%
    </p>

    <span class="badge ${decisionClass}">
      ${finalDecision} — ${scoreValue}%
      | Confiance ${confidence}%
    </span>

    <p class="small">
      Tu peux modifier la ligne ou la cote et recalculer avant de sauvegarder.
    </p>

    <button onclick="saveFrenchFlairAnalysis('${match.id}')">
      💾 Sauvegarder l’analyse
    </button>

    ${
      finalDecision === "VALUE"
        ? `
          <hr/>

          <label>
            <input
              type="checkbox"
              id="ff-placed-${match.id}"
            >
            Pari placé
          </label>

          <label>
            Montant misé
            <input
              id="ff-stake-${match.id}"
              type="number"
              min="0"
              step="0.01"
              placeholder="Ex : 10"
            >
          </label>

          <button onclick="saveFrenchFlairBet('${match.id}')">
            Sauvegarder le pari
          </button>
        `
        : ""
    }
  `;
};

/**
 * FRENCHFLAIR */
window.saveFrenchFlairAnalysis = function(matchId) {
  const pending = pendingFrenchFlairAnalyses.get(String(matchId));

  if (!pending) {
    alert("Calcule d’abord la value avant de sauvegarder.");
    return;
  }

  saveAnalysis(pending);
  pendingFrenchFlairAnalyses.delete(String(matchId));

  alert("Analyse sauvegardée dans le Journal.");

  // VALUE ou NO VALUE : le match disparaît seulement
  // après ton action volontaire de sauvegarde.
  init();
};
window.saveFrenchFlairBet = function(matchId, analysisId) {
  const match = getFrenchFlairMatchById(matchId);
  const analysis =
  pendingFrenchFlairAnalyses.get(String(matchId)) ||
  getAnalysisForMatch(match?.id);

  if (!match || !analysis) {
    alert("Analyse introuvable.");
    return;
  }

  const placed = document.getElementById(`ff-placed-${match.id}`)?.checked;
  const stake = Number(document.getElementById(`ff-stake-${match.id}`)?.value || 0);

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
  saveAnalysis({
  ...analysis,
  placed: true,
  stake,
  status: "betPlaced"
});

pendingFrenchFlairAnalyses.delete(String(matchId));

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
function computeFrenchFlairScore({ modelEdgePercent, confidence, sigma, predictedTotal, mathValue }) {
  const edgeScore = clamp(Math.max(modelEdgePercent, 0) / 10, 0, 1) * 40;
  const confidenceScore = clamp(confidence / 100, 0, 1) * 20;

  const sigmaRatio = predictedTotal > 0 ? sigma / predictedTotal : 1;
  const sigmaScore = clamp(1 - sigmaRatio, 0, 1) * 20;

  const mathValueScore = clamp(Math.max(mathValue, 0) / 0.10, 0, 1) * 20;

  return Math.round(edgeScore + confidenceScore + sigmaScore + mathValueScore);
}

window.navigateSportLab = function(page) {
  currentPage = page;
  init();
};

init();