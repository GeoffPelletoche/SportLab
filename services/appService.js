import {
  loadDrawHunterMatches
} from "../modules/drawhunter.js";

import {
  loadFrenchFlairMatches
} from "../modules/frenchflair.js";

import {
  getDashboardData
} from "./dashboardService.js";

import {
  getSettlementDiagnostic
} from "./diagnosticService.js";

import {
  getAnalyses
} from "../core/stores/analysisStore.js";

import {
  getAdvancedStatistics
} from "./statisticsService.js";

export async function loadApplicationData() {
  const [
    drawhunterPayload,
    frenchflairPayload
  ] = await Promise.all([
    loadDrawHunterMatches(),
    loadFrenchFlairMatches()
  ]);

  return {
    drawhunterPayload,
    frenchflairPayload,

    dashboard:
      getDashboardData(),

    analyses:
      getAnalyses(),

    diagnostic:
      getSettlementDiagnostic()
  };
}
