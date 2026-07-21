// services/renderService.js

import { renderDashboard } from "../ui/views/dashboardView.js";
import { renderDrawHunter } from "../ui/views/drawhunterView.js";
import { renderFrenchFlair } from "../ui/views/frenchflairView.js";
import { renderPortfolio } from "../ui/views/portfolioView.js";
import { renderJournal } from "../ui/views/journalView.js";
import { renderNavigation } from "../ui/views/navigationView.js";
import { renderBets } from "../ui/views/betsView.js";
import { renderDiagnostics } from "../ui/views/diagnosticsView.js";

export function renderApplication(app, data) {
  app.innerHTML = renderDashboard({
    drawhunterHtml: renderDrawHunter(data.drawhunterPayload),

    frenchflairHtml: renderFrenchFlair(
      data.frenchflairPayload
    ),

    portfolioHtml: renderPortfolio(
      data.dashboard.portfolio
    ),

    journalHtml: renderJournal(
      data.analyses
    ),

    navigationHtml: renderNavigation(
      data.currentPage
    ),

    activePage: data.currentPage,

    betsHtml: renderBets(
      data.dashboard.bets
    ),
    
    diagnosticsHtml:
    renderDiagnostics(
        data.diagnostic
    )
  });
}