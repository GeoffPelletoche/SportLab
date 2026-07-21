import { getAllBets } from "../services/betService.js";
import { runAutomaticSettlement } from "../services/settlementService.js";

export async function runSettlementDiagnostics() {
  const betsBefore = getAllBets();

  let reports = [];
  let globalError = null;

  try {
    const settlement = await runAutomaticSettlement();
    reports = settlement.reports;
  } catch (error) {
    globalError =
      error instanceof Error
        ? error.message
        : String(error);
  }

  const betsAfter = getAllBets();

  const diagnostic = {
    checkedAt: new Date().toISOString(),

    location: {
      origin: window.location.origin,
      pathname: window.location.pathname,
      displayMode: window.matchMedia(
        "(display-mode: standalone)"
      ).matches
        ? "standalone"
        : "browser"
    },

    betsBefore: betsBefore.map(bet => ({
      id: bet.id,
      match: bet.match,
      matchId: bet.matchId,
      matchDate: bet.matchDate,
      sport: bet.sport,
      market: bet.market,
      line: bet.line,
      result: bet.result,
      placed: bet.placed
    })),

    reports,

    betsAfter: betsAfter.map(bet => ({
      id: bet.id,
      match: bet.match,
      result: bet.result,
      finalStatus: bet.finalStatus,
      finalHomePoints: bet.finalHomePoints,
      finalAwayPoints: bet.finalAwayPoints,
      finalTotalPoints: bet.finalTotalPoints
    })),

    globalError
  };

  localStorage.setItem(
    "sportlab_settlement_debug",
    JSON.stringify(diagnostic)
  );

  return diagnostic;
}
