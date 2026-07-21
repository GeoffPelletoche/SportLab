// services/renderService.js

import { renderDashboard } from "../ui/views/dashboardView.js";
import { renderJournal } from "../ui/views/journalView.js";
import { renderPortfolio } from "../ui/views/portfolioView.js";
import { renderDiagnostics } from "../ui/views/diagnosticsView.js";

/**
 * SPORTLAB V6.3.1
 *
 * Render central de l'application.
 *
 * Aucune logique métier.
 * Aucune récupération de données.
 *
 * Il distribue simplement les données
 * vers les vues.
 */

export function renderApplication(app, data) {

    const page =
        data.currentPage ?? "dashboard";

    switch (page) {

        case "dashboard":

            app.innerHTML =
                renderDashboard(
                    data.dashboard
                );

            break;

        case "journal":

            app.innerHTML =
                renderJournal(
                    data.journal
                );

            break;

        case "portfolio":

            app.innerHTML =
                renderPortfolio({
                    summary:
                        data.dashboard.portfolio,

                    statistics:
                        data.statistics
                });

            break;

        case "diagnostics":

            app.innerHTML =
                renderDiagnostics(
                    data.diagnostic
                );

            break;

        default:

            app.innerHTML =
                renderDashboard(
                    data.dashboard
                );
    }
}