// services/portfolioService.js

import { getROI } from "../core/engines/roiEngine.js";

export function getPortfolioSummary() {
    const roi = getROI();

    return {
        totalBets: toNumber(roi?.totalBets),
        placedBets: toNumber(roi?.placedBets),
        nonPlacedBets: toNumber(roi?.nonPlacedBets),

        wins: toNumber(roi?.wins),
        losses: toNumber(roi?.losses),
        pushes: toNumber(roi?.pushes),
        pending: toNumber(roi?.pending),

        invested: toNumber(roi?.invested),
        profit: toNumber(roi?.profit),
        roi: toNumber(roi?.roi)
    };
}

function toNumber(value) {
    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : 0;
}
