// SPORTLAB V7.0.0 — Legacy runtime encapsulated by Sprint 7.1 Core Foundation
import { loadApplicationData, loadLocalApplicationData, loadDrawHunterApplicationData, loadFrenchFlairApplicationData, loadNflApplicationData } from "./services/appService.js";

import { computeValue } from "./core/engines/valueEngine.js";

import {
  createBet,
  getAllBets
} from "./services/betService.js";

import {
  runAutomaticSettlement
} from "./services/settlementService.js";
import { evaluatePendingPredictions } from "./core/performance/predictionEvaluationEngine.js";

import { saveAnalysis, getAnalysisForMatch } from "./core/stores/analysisStore.js";

import { renderApplication } from "./services/renderService.js";

import { initSportLabUi } from "./ui/interactions/sportlabUi.js";
import { initDashboardPremium } from "./ui/interactions/dashboardPremium.js";
import { initDrawHunterWorkflow } from "./ui/interactions/drawHunterWorkflow.js";
import { initFrenchFlairWorkflow } from "./ui/interactions/frenchFlairWorkflow.js";
import { saveDrawHunterMatchWorkflow } from "./core/stores/drawHunterWorkflowStore.js";
import { saveFrenchFlairMatchWorkflow } from "./core/stores/frenchFlairWorkflowStore.js";

import {
  runSettlementDiagnostics
} from "./debug/settlementDiagnostics.js";

let drawhunterPayload = null;
let frenchflairPayload = null;
let nflPayload = null;
const pendingFrenchFlairAnalyses = new Map();
const pendingNflAnalyses = new Map();
let currentPage = "home";
let currentAppData = null;
let initializationRun = 0;
let drawHunterRefreshPromise = null;
let frenchFlairRefreshPromise = null;
let nflRefreshPromise = null;
let drawHunterRefreshGeneration = 0;
let frenchFlairRefreshGeneration = 0;
let nflRefreshGeneration = 0;
let drawHunterReady = false;
let frenchFlairReady = false;
let nflReady = false;
let postLoadTasksStarted = false;

// V11.4.6 — Startup Resilience
// A transient first-load failure must not immediately downgrade a module to ERROR.
const STARTUP_RETRY_DELAYS_MS = [1200, 2500];

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isErrorPayload(payload) {
  return payload?.meta?.error === true;
}

function retryPayload(previousPayload, sport, attempt, maxAttempts, message = "") {
  const previousMatches = Array.isArray(previousPayload?.matches) ? previousPayload.matches : [];
  return {
    ...(previousPayload || {}),
    matches: previousMatches,
    meta: {
      ...(previousPayload?.meta || {}),
      sport,
      loading: true,
      retrying: true,
      retryAttempt: attempt,
      retryMax: maxAttempts,
      error: false,
      errorMessage: "",
      transientErrorMessage: message || "Nouvelle tentative automatique en cours."
    }
  };
}

async function loadSportWithStartupRetry({ load, previousPayload, sport, reason, generationIsCurrent, publishProgress, publishRetry }) {
  const retryDelays = reason === "startup" ? STARTUP_RETRY_DELAYS_MS : [];
  const maxAttempts = 1 + retryDelays.length;
  let lastPayload = null;
  let lastError = null;

  for (let index = 0; index < maxAttempts; index += 1) {
    if (!generationIsCurrent()) return null;
    try {
      lastPayload = await load({
        onProgress: progress => {
          if (generationIsCurrent()) publishProgress(progress);
        }
      });
      lastError = null;
      if (!isErrorPayload(lastPayload)) return lastPayload;
      lastError = new Error(lastPayload?.meta?.errorMessage || `Synchronisation ${sport} temporairement indisponible.`);
    } catch (error) {
      lastError = error;
    }

    if (index >= retryDelays.length || !generationIsCurrent()) break;
    publishRetry(retryPayload(previousPayload, sport, index + 1, retryDelays.length, lastError?.message));
    await sleep(retryDelays[index]);
  }

  if (lastPayload && isErrorPayload(lastPayload)) return lastPayload;
  return {
    matches: Array.isArray(previousPayload?.matches) ? previousPayload.matches : [],
    meta: {
      ...(previousPayload?.meta || {}), sport, loading: false, retrying: false, error: true,
      errorMessage: lastError?.message || `Synchronisation ${sport} indisponible.`
    }
  };
}

function isMatchEditableBeforeKickoff(match) {
  const kickoff = Date.parse(match?.date || match?.matchDate || "");
  return Number.isFinite(kickoff) && kickoff > Date.now();
}

function initializeUi() {
  initSportLabUi();
  initDashboardPremium();
  initDrawHunterWorkflow();
  initFrenchFlairWorkflow();
}

async function init({ forceSports = false } = {}) {
  const app = document.getElementById("app");
  const runId = ++initializationRun;

  try {
    const localData = loadLocalApplicationData();
    currentAppData = {
      ...localData,
      drawhunterPayload: withSportLoadingState(drawhunterPayload, drawHunterReady, "football"),
      frenchflairPayload: withSportLoadingState(frenchflairPayload, frenchFlairReady, "rugby"),
      nflPayload: withSportLoadingState(nflPayload, nflReady, "nfl")
    };
    renderCurrentApplication(app);

    // V11.3.16 — Football et Rugby sont totalement indépendants.
    // Aucun sport n'attend l'autre pour publier ses rencontres.
    void refreshDrawHunterData({ force: forceSports, reason: forceSports ? "manual" : "startup" });
    void refreshFrenchFlairData({ force: forceSports, reason: forceSports ? "manual" : "startup" });
    void refreshNflData({ force: forceSports, reason: forceSports ? "manual" : "startup" });
    return { runId };
  } catch (error) {
    console.error("SportLab init error:", error);
    const message = error?.message || String(error) || "Erreur inconnue au chargement de SportLab.";
    app.innerHTML = `<h1>🏟️ SportLab</h1><section class="card"><h2>Erreur de chargement</h2><p>${message}</p></section>`;
    return { runId, error };
  }
}

function withSportLoadingState(payload, ready, sport) {
  if (payload) return { ...payload, meta: { ...(payload.meta || {}), loading: !ready, sport } };
  return { matches: [], meta: { loading: true, sport, phase: "startup" } };
}

function publishSportPayload(kind, payload, { ready = false, reason = "background" } = {}) {
  if (kind === "drawhunter") {
    drawhunterPayload = payload;
    drawHunterReady = ready;
  } else if (kind === "frenchflair") {
    frenchflairPayload = payload;
    frenchFlairReady = ready;
  } else if (kind === "nfl") {
    nflPayload = payload;
    nflReady = ready;
  }

  currentAppData = {
    ...loadLocalApplicationData(),
    drawhunterPayload: withSportLoadingState(drawhunterPayload, drawHunterReady, "football"),
    frenchflairPayload: withSportLoadingState(frenchflairPayload, frenchFlairReady, "rugby"),
    nflPayload: withSportLoadingState(nflPayload, nflReady, "nfl")
  };
  renderCurrentApplication();
  window.dispatchEvent(new CustomEvent("sportlab:sports-data-updated", {
    detail: {
      reason,
      sport: kind === "drawhunter" ? "football" : kind === "frenchflair" ? "rugby" : "nfl",
      drawhunter: drawhunterPayload?.matches?.length || 0,
      frenchflair: frenchflairPayload?.matches?.length || 0,
      nfl: nflPayload?.matches?.length || 0,
      drawhunterReady: drawHunterReady,
      frenchflairReady: frenchFlairReady,
      nflReady
    }
  }));
}

async function refreshDrawHunterData({ force = false, reason = "background" } = {}) {
  if (drawHunterRefreshPromise && !force) return drawHunterRefreshPromise;
  const generation = ++drawHunterRefreshGeneration;
  drawHunterReady = false;
  publishSportPayload("drawhunter", withSportLoadingState(drawhunterPayload, false, "football"), { ready: false, reason });

  const task = (async () => {
    try {
      const payload = await loadSportWithStartupRetry({
        load: loadDrawHunterApplicationData, previousPayload: drawhunterPayload, sport: "football", reason,
        generationIsCurrent: () => generation === drawHunterRefreshGeneration,
        publishProgress: progressPayload => publishSportPayload("drawhunter", progressPayload, { ready: false, reason: `${reason}:progress` }),
        publishRetry: retryPayloadValue => publishSportPayload("drawhunter", retryPayloadValue, { ready: false, reason: `${reason}:retry` })
      });
      if (generation !== drawHunterRefreshGeneration) return null;
      publishSportPayload("drawhunter", payload, { ready: true, reason });
      maybeStartPostSportsTasks();
      return payload;
    } catch (error) {
      console.error("[DrawHunterData] Échec du rafraîchissement :", error);
      if (generation !== drawHunterRefreshGeneration) return null;
      publishSportPayload("drawhunter", drawhunterPayload || { matches: [], meta: { error: true, errorMessage: error?.message || String(error) } }, { ready: true, reason });
      return null;
    } finally {
      if (generation === drawHunterRefreshGeneration) drawHunterRefreshPromise = null;
    }
  })();
  drawHunterRefreshPromise = task;
  return task;
}

async function refreshFrenchFlairData({ force = false, reason = "background" } = {}) {
  if (frenchFlairRefreshPromise && !force) return frenchFlairRefreshPromise;
  const generation = ++frenchFlairRefreshGeneration;
  frenchFlairReady = false;
  publishSportPayload("frenchflair", withSportLoadingState(frenchflairPayload, false, "rugby"), { ready: false, reason });

  const task = (async () => {
    try {
      const payload = await loadSportWithStartupRetry({
        load: loadFrenchFlairApplicationData, previousPayload: frenchflairPayload, sport: "rugby", reason,
        generationIsCurrent: () => generation === frenchFlairRefreshGeneration,
        publishProgress: progressPayload => publishSportPayload("frenchflair", progressPayload, { ready: false, reason: `${reason}:progress` }),
        publishRetry: retryPayloadValue => publishSportPayload("frenchflair", retryPayloadValue, { ready: false, reason: `${reason}:retry` })
      });
      if (generation !== frenchFlairRefreshGeneration) return null;
      publishSportPayload("frenchflair", payload, { ready: true, reason });
      maybeStartPostSportsTasks();
      return payload;
    } catch (error) {
      console.error("[FrenchFlairData] Échec du rafraîchissement :", error);
      if (generation !== frenchFlairRefreshGeneration) return null;
      publishSportPayload("frenchflair", frenchflairPayload || { matches: [], meta: { error: true, errorMessage: error?.message || String(error) } }, { ready: true, reason });
      return null;
    } finally {
      if (generation === frenchFlairRefreshGeneration) frenchFlairRefreshPromise = null;
    }
  })();
  frenchFlairRefreshPromise = task;
  return task;
}

async function refreshNflData({ force = false, reason = "background" } = {}) {
  if (nflRefreshPromise && !force) return nflRefreshPromise;
  const generation = ++nflRefreshGeneration;
  nflReady = false;
  publishSportPayload("nfl", withSportLoadingState(nflPayload, false, "nfl"), { ready: false, reason });
  const task = (async () => {
    try {
      const payload = await loadSportWithStartupRetry({
        load: loadNflApplicationData, previousPayload: nflPayload, sport: "nfl", reason,
        generationIsCurrent: () => generation === nflRefreshGeneration,
        publishProgress: progress => publishSportPayload("nfl", progress, { ready: false, reason: `${reason}:progress` }),
        publishRetry: retryPayloadValue => publishSportPayload("nfl", retryPayloadValue, { ready: false, reason: `${reason}:retry` })
      });
      if (generation !== nflRefreshGeneration) return null;
      publishSportPayload("nfl", payload, { ready: true, reason });
      return payload;
    } catch (error) {
      console.error("[NFLData] Échec du rafraîchissement :", error);
      if (generation !== nflRefreshGeneration) return null;
      publishSportPayload("nfl", nflPayload || { matches: [], meta: { error: true, errorMessage: error?.message || String(error) } }, { ready: true, reason });
      return null;
    } finally { if (generation === nflRefreshGeneration) nflRefreshPromise = null; }
  })();
  nflRefreshPromise = task; return task;
}

function maybeStartPostSportsTasks() {
  if (postLoadTasksStarted || !drawHunterReady || !frenchFlairReady) return;
  postLoadTasksStarted = true;
  void runPostSportsTasks(Math.max(drawHunterRefreshGeneration, frenchFlairRefreshGeneration));
}

async function runPostSportsTasks(generation) {
  try {
    const predictionEvaluation = await evaluatePendingPredictions();
    console.log("[PredictionEvaluation]", predictionEvaluation);
    if (predictionEvaluation.evaluated > 0) {
      currentAppData = { ...currentAppData, ...loadLocalApplicationData() };
      renderCurrentApplication();
    }
  } catch (error) {
    console.warn("[PredictionEvaluation] Échec", error);
  }

  try {
    const settlement = await runAutomaticSettlement();
    console.log("[Settlement] Règlement automatique terminé :", settlement.reports);
    if (settlement.settledCount > 0) {
      currentAppData = {
        ...loadLocalApplicationData(),
        drawhunterPayload,
        frenchflairPayload
      };
      renderCurrentApplication();
    }
  } catch (error) {
    console.error("[Settlement] Échec du règlement automatique :", error);
  }
}

function renderCurrentApplication(app = document.getElementById("app")) {
  if (!app || !currentAppData) return;
  renderApplication(app, { ...currentAppData, currentPage });
  initializeUi();
}

/**
 * DRAWHUNTER
 */
window.saveDrawHunterBet = function(matchId) {
  const match = (drawhunterPayload?.matches || []).find(
    item => String(item?.id) === String(matchId)
  );

  if (!match) {
    alert("Match introuvable.");
    return;
  }

  if (!isMatchEditableBeforeKickoff(match)) {
    alert("Le match a commencé : l’analyse et le pari sont désormais en lecture seule.");
    return;
  }

  const bookmakerOdds = Number(
    document.getElementById(`draw-odds-${match.id}`)?.value || 0
  );
  const placed = document.getElementById(`draw-placed-${match.id}`)?.checked;
  const stake = Number(document.getElementById(`draw-stake-${match.id}`)?.value || 0);

  if (!Number.isFinite(bookmakerOdds) || bookmakerOdds <= 1) {
    alert("Saisis une cote bookmaker valide avant d’enregistrer.");
    return;
  }

  if (placed && stake <= 0) {
    alert("Saisis un montant misé valide.");
    return;
  }

  const valuation = computeValue({
    probability: match.probability,
    odds: bookmakerOdds,
    minValue: 0.01
  });

  const saved = createBet({
  source: "DrawHunter",
  sport: "football",
  competition: match.competition || null,

  matchId: match.id ?? null,
  matchDate: match.date || null,

  match: `${match.home} vs ${match.away}`,
  home: match.home,
  away: match.away,
  homeId: match.homeId ?? null,
  awayId: match.awayId ?? null,
  homeLogo: match.homeLogo || null,
  awayLogo: match.awayLogo || null,
  market: "DRAW",
  line: null,
  odds: bookmakerOdds,
  probability: match.probability,
  value: valuation.value,
  edge: valuation.edge,
  decision: valuation.decision,
  placed,
  stake
});

  saveDrawHunterMatchWorkflow(match.id, {
    status: "awaiting_result",
    bookmakerOdds,
    impliedProbability: valuation.impliedProbability,
    value: valuation.value,
    edge: valuation.edge,
    decision: valuation.decision,
    reason: valuation.reason,
    placed: Boolean(saved.placed),
    stake: Number(saved.stake || 0),
    event: {
      type: saved.placed ? "tracked" : "decided",
      label: saved.placed ? "Pari enregistré" : "Analyse enregistrée",
      note: saved.placed ? `Mise : ${Number(saved.stake || 0).toFixed(2)} €` : "Aucun pari placé"
    }
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

  if (!isMatchEditableBeforeKickoff(match)) {
    alert("Le match a commencé : la ligne, la cote et la décision sont désormais en lecture seule.");
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

  /*
   * Garde VALUE mathématique : le score qualitatif FrenchFlair ne peut
   * jamais transformer une espérance négative en pari VALUE.
   * computeValue() utilise minValue = 0.01, on conserve donc ce seuil
   * minimum d'un point de probabilité au-dessus de la cote implicite.
   */
  const hasPositiveValue =
    value.value >= 0.01 &&
    value.edge > 0 &&
    probability > value.impliedProbability;

  const finalDecision =
    hasPositiveValue && scoreValue >= 70
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
    homeId: match.homeId ?? null,
    awayId: match.awayId ?? null,
    homeLogo: match.homeLogo || null,
    awayLogo: match.awayLogo || null,
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

  const match = getFrenchFlairMatchById(matchId);
  if (!match || !isMatchEditableBeforeKickoff(match)) {
    alert("Le match a commencé : l’analyse ne peut plus être modifiée.");
    return;
  }

  saveAnalysis(pending);
  saveFrenchFlairMatchWorkflow(matchId, {
    status: pending.finalDecision === "VALUE" ? "value" : "decided",
    decision: pending.finalDecision,
    event: { type: pending.finalDecision === "VALUE" ? "value" : "decided", label: pending.finalDecision === "VALUE" ? "VALUE détectée" : "Analyse enregistrée", note: `${pending.market} ${Number(pending.line).toFixed(1)} · cote ${Number(pending.odds).toFixed(2)}` }
  });
  pendingFrenchFlairAnalyses.delete(String(matchId));

  alert("Analyse sauvegardée dans le Journal.");

  // VALUE ou NO VALUE : le match disparaît seulement
  // après ton action volontaire de sauvegarde.
  init();
};
window.saveFrenchFlairBet = function(matchId, analysisId) {
  const match = getFrenchFlairMatchById(matchId);
  console.log("[FrenchFlair] Objet match :", match);
  const analysis =
  pendingFrenchFlairAnalyses.get(String(matchId)) ||
  getAnalysisForMatch(match?.id);

  if (!match || !analysis) {
    alert("Analyse introuvable.");
    return;
  }

  if (!isMatchEditableBeforeKickoff(match)) {
    alert("Le match a commencé : aucun pari ne peut plus être ajouté ou modifié.");
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

pendingFrenchFlairAnalyses.delete(String(matchId));

if (!match?.id || !match?.date) {
  console.error(
    "[FrenchFlair] Match incomplet au moment de sauvegarder le pari :",
    match
  );

  alert(
    "Impossible d’enregistrer ce pari : identifiant ou date du match manquant."
  );

  return;
}

  const savedBet = createBet({
  source: "FrenchFlair",
  sport: "rugby",
  competition: match.competition || null,

  matchId: match.id ?? null,
  matchDate: match.date || null,

  match: `${match.home} vs ${match.away}`,
  home: match.home,
  away: match.away,
  homeId: match.homeId ?? null,
  awayId: match.awayId ?? null,
  homeLogo: match.homeLogo || null,
  awayLogo: match.awayLogo || null,
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

  saveFrenchFlairMatchWorkflow(matchId, {
    status: placed ? "tracked" : (analysis.finalDecision === "VALUE" ? "value" : "decided"),
    placed: Boolean(placed), stake,
    event: { type: placed ? "tracked" : "decided", label: placed ? "Pari enregistré" : "Analyse enregistrée", note: placed ? `Mise : ${stake.toFixed(2)} €` : "Aucun pari placé" }
  });
  alert("Analyse FrenchFlair sauvegardée.");
  init();
};



/** NFL TOTALS — SPRINT 0.2 */
window.analyzeNflValue = function(matchId) {
  const match = getNflMatchById(matchId); if (!match) return alert("Match NFL introuvable.");
  const existing = getAnalysisForMatch(match.id); const box = document.getElementById(`nfl-result-${match.id}`); if (!box) return;
  const recommendedMarket = existing?.market || (match.recommendedTrend === "UNDER" ? "UNDER" : "OVER");
  box.innerHTML = `<div class="nfl-analysis-recommendation">Préconisation SportLab : <strong>${recommendedMarket}</strong></div><div class="nfl-analysis-form"><label>Marché<select id="nfl-market-${match.id}"><option value="OVER" ${recommendedMarket==="OVER"?"selected":""}>Over</option><option value="UNDER" ${recommendedMarket==="UNDER"?"selected":""}>Under</option></select></label><label>Ligne Betclic<input id="nfl-line-${match.id}" type="number" step="0.5" placeholder="Ex : 45.5" value="${existing?.line??""}"></label><label>Cote<input id="nfl-odds-${match.id}" type="number" step="0.01" placeholder="Ex : 1.90" value="${existing?.odds||""}"></label><label>Notes<input id="nfl-notes-${match.id}" type="text" value="${existing?.notes??""}"></label></div><button class="sl-button sl-button-primary" onclick="calculateNflAnalysis('${match.id}')">Calculer la VALUE</button><div id="nfl-calculation-${match.id}"></div>`;
};
window.calculateNflAnalysis = function(matchId) {
  const match=getNflMatchById(matchId); if(!match) return alert("Match NFL introuvable."); if(!isMatchEditableBeforeKickoff(match)) return alert("Le match a commencé : analyse verrouillée.");
  const market=document.getElementById(`nfl-market-${match.id}`)?.value||"OVER"; const line=Number(document.getElementById(`nfl-line-${match.id}`)?.value||0); const odds=Number(document.getElementById(`nfl-odds-${match.id}`)?.value||0); const notes=document.getElementById(`nfl-notes-${match.id}`)?.value||"";
  if(line<=0||odds<=1) return alert("Saisis une ligne Betclic et une cote valides."); const mean=Number(match.predictedTotalPoints||0), sigma=Number(match.sigma||0); if(mean<=0||sigma<=0) return alert("Total modèle ou sigma NFL indisponible.");
  const probability=computeTotalsProbability(mean,sigma,market,line); const value=computeValue({probability,odds,minValue:0.01}); const modelEdgePoints=market==="OVER"?mean-line:line-mean; const modelEdgePercent=line>0?modelEdgePoints/line*100:0; const confidence=Number(match.confidence||0);
  const scoreValue=computeFrenchFlairScore({modelEdgePercent,confidence,sigma,predictedTotal:mean,mathValue:value.value});
  // V11.4.2 — une recommandation VALUE exige d'abord une vraie value mathématique positive.
  // Le score de qualité ne peut jamais transformer une EV négative en pari recommandé.
  const hasPositiveValue =
  value.value > 0 &&
  value.edge > 0 &&
  probability > value.impliedProbability;
  const finalDecision=hasPositiveValue && scoreValue>=70?"VALUE":"NO VALUE";
  const analysis={source:"NFL Totals",sport:"nfl",competition:"NFL",matchId:match.id,match:`${match.home} vs ${match.away}`,home:match.home,away:match.away,homeId:match.homeId,awayId:match.awayId,homeLogo:match.homeLogo||null,awayLogo:match.awayLogo||null,date:match.date,market,line,odds,probability,impliedProbability:value.impliedProbability,value:value.value,edge:value.edge,decision:value.decision,predictedHomePoints:match.predictedHomePoints,predictedAwayPoints:match.predictedAwayPoints,predictedTotalPoints:mean,modelEdgePoints,modelEdgePercent,sigma,confidence,scoreValue,finalDecision,placed:false,stake:0,status:"draft",notes,modelVersion:match.modelVersion||"NFL-TOTALS-11.4.1"}; pendingNflAnalyses.set(String(match.id),analysis);
  const box=document.getElementById(`nfl-calculation-${match.id}`); if(!box)return; box.innerHTML=`<hr><p><strong>${market} ${line.toFixed(1)}</strong> · cote ${odds.toFixed(2)}</p><p>Total modèle : <strong>${mean.toFixed(1)} pts</strong> · Sigma : ${sigma.toFixed(1)}</p><p>Probabilité SportLab : <strong>${(probability*100).toFixed(1)}%</strong> · implicite : ${(value.impliedProbability*100).toFixed(1)}%</p><p>Edge : <strong>${(value.edge*100).toFixed(1)}%</strong> · Value : ${(value.value*100).toFixed(1)}%</p><p><span class="badge ${finalDecision==="VALUE"?"badge-value":"badge-no"}">${finalDecision} — ${scoreValue}%</span></p><button onclick="saveNflAnalysis('${match.id}')">💾 Sauvegarder l’analyse</button>${finalDecision==="VALUE"?`<label><input type="checkbox" id="nfl-placed-${match.id}"> Pari placé</label><label>Mise <input id="nfl-stake-${match.id}" type="number" min="0" step="0.01"></label><button onclick="saveNflBet('${match.id}')">Sauvegarder le pari</button>`:""}`;
};
window.saveNflAnalysis=function(matchId){const a=pendingNflAnalyses.get(String(matchId)); if(!a)return alert("Calcule d’abord la VALUE."); saveAnalysis(a); pendingNflAnalyses.delete(String(matchId)); alert("Analyse NFL sauvegardée dans le Journal."); init();};
window.saveNflBet=function(matchId){const match=getNflMatchById(matchId); const a=pendingNflAnalyses.get(String(matchId))||getAnalysisForMatch(match?.id); if(!match||!a)return alert("Analyse NFL introuvable."); if(!isMatchEditableBeforeKickoff(match))return alert("Le match a commencé : pari verrouillé."); const placed=document.getElementById(`nfl-placed-${match.id}`)?.checked; const stake=Number(document.getElementById(`nfl-stake-${match.id}`)?.value||0); if(placed&&stake<=0)return alert("Saisis une mise valide."); saveAnalysis({...a,placed,stake,status:placed?"betPlaced":"completed"}); createBet({source:"NFL Totals",sport:"nfl",competition:"NFL",matchId:match.id,matchDate:match.date,match:`${match.home} vs ${match.away}`,home:match.home,away:match.away,homeId:match.homeId,awayId:match.awayId,homeLogo:match.homeLogo,awayLogo:match.awayLogo,market:`${a.market} ${a.line}`,line:a.line,odds:a.odds,probability:a.probability,value:a.value,edge:a.edge,decision:a.decision,placed,stake}); pendingNflAnalyses.delete(String(matchId)); alert("Analyse NFL sauvegardée."); init();};
function computeTotalsProbability(mean,sigma,market,line){const z=(line-mean)/sigma; const over=1-normalCdf(z); return clamp(market==="OVER"?over:1-over,.01,.99);}
function getNflMatchById(matchId){return nflPayload?.matches?.find(m=>String(m.id)===String(matchId))||null;}

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

function toggleSportLabMenu() {
  const header =
    document.querySelector(
      ".sportlab-app-header"
    );

  const toggle =
    document.getElementById(
      "sportlab-menu-toggle"
    );

  if (!header || !toggle) {
    return;
  }

  const isOpen =
    header.classList.toggle(
      "sportlab-menu-open"
    );

  toggle.setAttribute(
    "aria-expanded",
    String(isOpen)
  );

  toggle.setAttribute(
    "aria-label",
    isOpen
      ? "Fermer le menu"
      : "Ouvrir le menu"
  );

  document.body.classList.toggle(
    "sportlab-navigation-open",
    isOpen
  );
}

function closeSportLabMenu() {
  const header =
    document.querySelector(
      ".sportlab-app-header"
    );

  const toggle =
    document.getElementById(
      "sportlab-menu-toggle"
    );

  if (!header) {
    return;
  }

  header.classList.remove(
    "sportlab-menu-open"
  );

  document.body.classList.remove(
    "sportlab-navigation-open"
  );

  if (toggle) {
    toggle.setAttribute(
      "aria-expanded",
      "false"
    );

    toggle.setAttribute(
      "aria-label",
      "Ouvrir le menu"
    );
  }
}

window.refreshSportLab = async function() {
  // V11.3.15 : le bouton Actualiser force réellement la récupération
  // Football/Rugby, sans changer de page ni redémarrer le Cloud.
  await Promise.allSettled([
    refreshDrawHunterData({ force: true, reason: "manual" }),
    refreshFrenchFlairData({ force: true, reason: "manual" }),
    refreshNflData({ force: true, reason: "manual" })
  ]);
};

window.navigateSportLab = function(page) {
  closeSportLabMenu();
  currentPage = page;

  // V11.3.13 — Fast Navigation: changer de vue ne relance plus les appels
  // Football/Rugby, le settlement ni l'évaluation des prédictions.
  // On réutilise l'état déjà chargé en mémoire et on ne reconstruit que la vue.
  if (currentAppData) {
    renderCurrentApplication();
    return;
  }

  init();
};

window.toggleSportLabMenu = toggleSportLabMenu;

window.closeSportLabMenu = closeSportLabMenu;

document.addEventListener(
  "click",
  async event => {
    const button = event.target.closest(
      "#run-settlement-diagnostic"
    );

    if (!button) {
      return;
    }

    button.disabled = true;
    button.textContent =
      "⏳ Diagnostic en cours...";

    try {
      await runSettlementDiagnostics();

      const appData =
        await loadApplicationData();

      drawhunterPayload =
        appData.drawhunterPayload;

      frenchflairPayload =
        appData.frenchflairPayload;

      renderApplication(
        document.getElementById("app"),
        {
          ...appData,
          currentPage
        }
      );

      initializeUi();
    } catch (error) {
      console.error(
        "[Diagnostics] Échec du diagnostic :",
        error
      );

      button.disabled = false;
      button.textContent =
        "🔄 Relancer le diagnostic";
    }
  }
);


export async function startLegacyApplication() {
  return init();
}

export function getLegacyRuntimeState() {
  return {
    currentPage,
    drawhunterLoaded: Boolean(drawhunterPayload),
    frenchflairLoaded: Boolean(frenchflairPayload),
    nflLoaded: Boolean(nflPayload),
    sportsDataReady: drawHunterReady && frenchFlairReady,
    drawHunterReady,
    frenchFlairReady,
    nflReady,
    sportsRefreshInFlight: Boolean(drawHunterRefreshPromise || frenchFlairRefreshPromise || nflRefreshPromise),
    drawHunterRefreshInFlight: Boolean(drawHunterRefreshPromise),
    frenchFlairRefreshInFlight: Boolean(frenchFlairRefreshPromise),
    nflRefreshInFlight: Boolean(nflRefreshPromise)
  };
}


// SPORTLAB V7.1.2B — Commandes du Cloud Dashboard
window.runSportLabCloudSync = async function() {
  const button = document.querySelector(".cloud-dashboard-actions .sl-button-primary");
  if (button) { button.disabled = true; button.textContent = "Synchronisation…"; }
  try {
    await window.SportLabCore?.cloud?.syncNow?.({ reason: "manual" });
  } catch (error) {
    console.error("[Cloud Dashboard] Synchronisation impossible", error);
  } finally {
    await init();
  }
};

window.openSportLabCloudSettings = function() {
  document.getElementById("sportlab-cloud-button")?.click();
};

window.addEventListener("sportlab:cloud-config", () => {
  if (currentPage === "cloud") renderCurrentApplication();
});
window.addEventListener("online", () => { if (currentPage === "cloud") renderCurrentApplication(); });
window.addEventListener("offline", () => { if (currentPage === "cloud") renderCurrentApplication(); });

// SPORTLAB V7.1.2C — Recovery & Conflict Center
async function refreshRecoveryCenter() { renderCurrentApplication(); }
window.previewSportLabRecovery = async function() {
  try { await window.SportLabCore?.recovery?.preview?.(); } catch (error) { alert(`Comparaison impossible : ${error.message}`); }
  await refreshRecoveryCenter();
};
window.restoreSportLabCloudToLocal = async function() {
  if (!confirm("Cette opération remplacera les données locales après création d’un snapshot de sécurité. Continuer ?")) return;
  try { await window.SportLabCore?.recovery?.restoreCloudToLocal?.(); } catch (error) { alert(`Restauration impossible : ${error.message}`); }
  await refreshRecoveryCenter();
};
window.forceSportLabLocalToCloud = async function() {
  if (!confirm("Cette opération sauvegardera volontairement la version locale dans le cloud. Continuer ?")) return;
  try { await window.SportLabCore?.recovery?.forceLocalToCloud?.(); } catch (error) { alert(`Sauvegarde impossible : ${error.message}`); }
  await refreshRecoveryCenter();
};
window.mergeSportLabCloudData = async function() {
  if (!confirm("Lancer la fusion intelligente Local / Cloud avec la stratégie LWW ?")) return;
  try { await window.SportLabCore?.recovery?.smartMerge?.(); } catch (error) { alert(`Fusion impossible : ${error.message}`); }
  await refreshRecoveryCenter();
};
window.restoreSportLabSnapshot = async function(snapshotId) {
  if (!confirm("Restaurer ce snapshot local ? Un snapshot de sécurité sera créé avant l’opération.")) return;
  try { window.SportLabCore?.recovery?.restoreSnapshot?.(snapshotId); } catch (error) { alert(`Rollback impossible : ${error.message}`); }
  await refreshRecoveryCenter();
};
window.clearSportLabResolvedConflicts = async function() {
  if (!confirm("Effacer l’historique des conflits déjà résolus ? Les données SportLab et la file de synchronisation seront conservées.")) return;
  try { window.SportLabCore?.recovery?.clearResolvedConflictHistory?.(); } catch (error) { alert(`Nettoyage impossible : ${error.message}`); }
  await refreshRecoveryCenter();
};
window.addEventListener("sportlab:recovery-updated", () => { if (currentPage === "recovery" || currentPage === "cloud") renderCurrentApplication(); });
