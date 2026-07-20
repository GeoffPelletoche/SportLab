// services/appService.js

import { loadDrawHunterMatches } from "../modules/drawhunter.js";
import { loadFrenchFlairMatches } from "../modules/frenchflair.js";

import { getPortfolioSummary } from "./portfolioService.js";
import { getAllBets } from "./betService.js";

import { getAnalyses } from "../core/stores/analysisStore.js";

export async function loadApplicationData() {
  const drawhunterPayload = await loadDrawHunterMatches();
  const frenchflairPayload = await loadFrenchFlairMatches();

  return {
    drawhunterPayload,
    frenchflairPayload,

    portfolio: getPortfolioSummary(),
    analyses: getAnalyses(),
    bets: getAllBets()
  };
}