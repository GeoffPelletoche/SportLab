// services/appService.js

import { getDashboardData } from "./dashboardService.js";
import { getAnalyses } from "./analysisService.js";
import { getJournalData } from "./journalService.js";
import { getAdvancedStatistics } from "./statisticsService.js";
import { getSettlementDiagnostic } from "./diagnosticService.js";

import { getDrawHunterPayload } from "./drawHunterService.js";
import { getFrenchFlairPayload } from "./frenchFlairService.js";

/**
 * SPORTLAB V6.3.1
 *
 * Point d'entrée unique des données de l'application.
 */

export function loadApplicationData() {

    return {

        /*
         * Tableau de bord
         */
        dashboard:
            getDashboardData(),

        /*
         * Analyses brutes
         */
        analyses:
            getAnalyses(),

        /*
         * Journal intelligent
         */
        journal:
            getJournalData(),

        /*
         * Statistiques avancées
         */
        statistics:
            getAdvancedStatistics(),

        /*
         * Diagnostics
         */
        diagnostic:
            getSettlementDiagnostic(),

        /*
         * Payload DrawHunter
         */
        drawhunterPayload:
            getDrawHunterPayload(),

        /*
         * Payload FrenchFlair
         */
        frenchflairPayload:
            getFrenchFlairPayload()
    };
}