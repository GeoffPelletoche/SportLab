import { loadDrawHunterMatches } from "./modules/drawhunter.js";
import { loadFrenchFlairMatches } from "./modules/frenchflair.js";
import { getROI } from "./core/roiEngine.js";

import { renderDashboard } from "./ui/dashboardView.js";
import { renderDrawHunter } from "./ui/drawhunterView.js";
import { renderFrenchFlair } from "./ui/frenchflairView.js";
import { renderPortfolio } from "./ui/portfolioView.js";

async function init() {
  const app = document.getElementById("app");

  try {
    app.innerHTML = `<h1>🏟️ SportLab</h1><p>Chargement...</p>`;

    const drawhunterMatches = await loadDrawHunterMatches();
    const frenchflairMatches = await loadFrenchFlairMatches();
    const roi = getROI();

    app.innerHTML = renderDashboard({
      drawhunterHtml: renderDrawHunter(drawhunterMatches),
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

init();