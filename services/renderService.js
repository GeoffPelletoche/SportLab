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
      dashboard:

      data.dashboard || {},

    drawhunterPayload:

      data.drawhunterPayload || {},

    frenchflairPayload:

      data.frenchflairPayload || {}

    });
}