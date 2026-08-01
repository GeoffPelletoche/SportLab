// services/appService.js

import {
  getDashboardData
} from "./dashboardService.js";

import {
  getAnalyses
} from "./analysisService.js";

import {
  getJournalData
} from "./journalService.js";

import {
  getAdvancedStatistics
} from "./statisticsService.js";

import {
  getSettlementDiagnostic
} from "./diagnosticService.js";

import {
  getDrawHunterPayload
} from "./drawHunterService.js";

import {
  getFrenchFlairPayload
} from "./frenchFlairService.js";

/**
 * SPORTLAB V6.3.1
 *
 * Point d'entrée unique des données de l'application.
 */
export async function loadApplicationData() {
  /*
   * Les données locales sont synchrones.
   */
  const dashboard =
    getDashboardData();

  const analyses =
    getAnalyses();

  const journal =
    getJournalData();

  const statistics =
    getAdvancedStatistics();

  const diagnostic =
    getSettlementDiagnostic();

  /*
   * Les modules sportifs chargent des données
   * distantes : ils sont donc asynchrones.
   */
  const [
    drawhunterPayload,
    frenchflairPayload
  ] = await Promise.all([
    getDrawHunterPayload(),
    getFrenchFlairPayload()
  ]);

  return {
    dashboard,
    analyses,
    journal,
    statistics,
    diagnostic,
    drawhunterPayload,
    frenchflairPayload
  };
}