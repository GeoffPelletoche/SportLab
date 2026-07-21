// services/portfolioService.js

import {
  getROI
} from "../core/engines/roiEngine.js";

export function getPortfolioSummary() {
  const roi = getROI();

  return {
    totalBets:
      toNumber(roi?.totalBets),

    placedBets:
      toNumber(roi?.placedBets),

    nonPlacedBets:
      toNumber(roi?.nonPlacedBets),

    settledBets:
      toNumber(roi?.settledBets),

    wins:
      toNumber(roi?.wins),

    losses:
      toNumber(roi?.losses),

    pushes:
      toNumber(roi?.pushes),

    pending:
      toNumber(roi?.pending),

    /*
     * Mise des paris terminés.
     */
    invested:
      toNumber(roi?.invested),

    /*
     * Mise encore engagée sur les paris en attente.
     */
    pendingStake:
      toNumber(roi?.pendingStake),

    /*
     * Total des mises réglées et en attente.
     */
    totalCommitted:
      toNumber(roi?.totalCommitted),

    profit:
      toNumber(roi?.profit),

    roi:
      toNumber(roi?.roi),

    winRate:
      toNumber(roi?.winRate)
  };
}

function toNumber(value) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
}