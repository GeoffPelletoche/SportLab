import { loadDrawHunterMatches } from "./modules/drawhunter.js";
import { loadFrenchFlairMatches } from "./modules/frenchflair.js";
import { getROI } from "./core/roiEngine.js";
import { saveBet } from "./core/betsStore.js";

import { renderDashboard } from "./ui/dashboardView.js";
import { renderDrawHunter } from "./ui/drawhunterView.js";
import { renderFrenchFlair } from "./ui/frenchflairView.js";
import { renderPortfolio } from "./ui/portfolioView.js";

let drawhunterPayload = null;

async function init() {
  const app = document.getElementById("app");

  try {
    app.innerHTML = `<h1>🏟️ SportLab</h1><p>Chargement...</p>`;

    drawhunterPayload = await loadDrawHunterMatches();
    const frenchflairMatches = await loadFrenchFlairMatches();
    const roi = getROI();

    app.innerHTML = renderDashboard({
      drawhunterHtml: renderDrawHunter(drawhunterPayload),
      frenchflairHtml: renderFrenchFlair(frenchflairMatches),
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
      : "Analyse sauvegardée en non placé."
  );

  init();
};

init();