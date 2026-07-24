// services/renderService.js

import {
  renderDashboard
} from "../ui/views/dashboardView.js";

import {
  renderNavigation
} from "../ui/views/navigationView.js";

import {
  renderDrawHunter
} from "../ui/views/drawhunterView.js";

import {
  renderFrenchFlair
} from "../ui/views/frenchflairView.js";

import {
  renderJournal
} from "../ui/views/journalView.js";

import {
  renderBets
} from "../ui/views/betsView.js";

import {
  renderPortfolio
} from "../ui/views/portfolioView.js";

import {
  renderDiagnostics
} from "../ui/views/diagnosticsView.js";

import { renderCloudDashboard } from "../ui/views/cloudDashboardView.js";
import { renderRecoveryCenter } from "../ui/views/recoveryCenterView.js";

/**
 * SPORTLAB V6.3.1
 *
 * Render central de l'application.
 *
 * Responsabilité :
 * - construire les différentes vues ;
 * - transmettre leur HTML à dashboardView ;
 * - ne contenir aucune logique métier.
 */
export function renderApplication(app, data = {}) {
  const activePage =
    data.currentPage || "home";

  const navigationHtml =
    renderNavigation(activePage);

  const drawhunterHtml =
    renderDrawHunter(
      data.drawhunterPayload
    );

  const frenchflairHtml =
    renderFrenchFlair(
      data.frenchflairPayload
    );

  const journalHtml =
    renderJournal(
      data.journal
    );

  const betsHtml =
    renderBets(
      data.dashboard?.bets || []
    );

  const portfolioHtml =
    renderPortfolio({
      summary:
        data.dashboard?.portfolio || {},

      statistics:
        data.statistics || {}
    });

  const diagnosticsHtml =
    renderDiagnostics(
      data.diagnostic
    );

  const cloudState = window.SportLabCore?.cloud?.status?.() || {};
  const recoveryState = window.SportLabCore?.recovery?.state?.() || {};
  const cloudHtml = renderCloudDashboard({
    cloud: cloudState,
    storageSummary: buildCloudStorageSummary(),
    recovery: recoveryState
  });
  const recoveryHtml = renderRecoveryCenter({ recovery: recoveryState, cloud: cloudState });

  app.innerHTML =
    renderDashboard({
      activePage,
      navigationHtml,
      drawhunterHtml,
      frenchflairHtml,
      journalHtml,
      betsHtml,
      portfolioHtml,
      diagnosticsHtml,
      cloudHtml,
      recoveryHtml,
      dashboard:

      data.dashboard || {},

    drawhunterPayload:

      data.drawhunterPayload || {},

    frenchflairPayload:

      data.frenchflairPayload || {}

    });
}

function buildCloudStorageSummary() {
  const counts = { analyses: 0, bets: 0, drawhunter: 0, frenchflair: 0, total: 0 };
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index) || "";
    if (key.startsWith("sportlab.v7.cloud")) continue;
    let value;
    try { value = JSON.parse(localStorage.getItem(key)); } catch { value = localStorage.getItem(key); }
    const count = Array.isArray(value) ? value.length : value && typeof value === "object" ? Object.keys(value).length : value ? 1 : 0;
    counts.total += count;
    const normalized = key.toLowerCase();
    if (normalized.includes("analys")) counts.analyses += count;
    if (normalized.includes("bet") || normalized.includes("pari")) counts.bets += count;
    if (normalized.includes("drawhunter")) counts.drawhunter += count;
    if (normalized.includes("frenchflair")) counts.frenchflair += count;
  }
  return counts;
}
