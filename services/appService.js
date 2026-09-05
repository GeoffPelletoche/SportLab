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
export function loadLocalApplicationData() {
  return {
    dashboard: getDashboardData(),
    analyses: getAnalyses(),
    journal: getJournalData(),
    statistics: getAdvancedStatistics(),
    diagnostic: getSettlementDiagnostic()
  };
}

export async function loadDrawHunterApplicationData(options = {}) {
  return getDrawHunterPayload(options);
}

export async function loadFrenchFlairApplicationData(options = {}) {
  return getFrenchFlairPayload(options);
}

export async function loadSportsApplicationData(options = {}) {
  const [drawhunterPayload, frenchflairPayload] = await Promise.all([
    loadDrawHunterApplicationData(options.drawhunter || {}),
    loadFrenchFlairApplicationData(options.frenchflair || {})
  ]);

  return { drawhunterPayload, frenchflairPayload };
}

export async function loadApplicationData() {
  const localData = loadLocalApplicationData();
  const sportsData = await loadSportsApplicationData();
  return { ...localData, ...sportsData };
}
