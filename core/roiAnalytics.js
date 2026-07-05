import { getROI } from "./roiEngine.js";

/**
 * 📊 SPORTLAB ROI ANALYTICS V1.5
 */

export function getAnalytics() {

  const bets = JSON.parse(localStorage.getItem("sportlab_bets")) || [];

  const roi = getROI();

  // 📈 bankroll evolution
  const bankrollCurve = buildBankrollCurve(bets);

  // ⚽ / 🏉 split
  const sportSplit = getSportSplit(bets);

  // 🎯 value vs no bet
  const decisionSplit = getDecisionSplit(bets);

  return {
    roi,
    bankrollCurve,
    sportSplit,
    decisionSplit
  };
}

/**
 * 📈 BANKROLL CURVE (SIMULATED REAL TRACKING)
 */
function buildBankrollCurve(bets) {

  let bankroll = 100;
  const curve = [];

  bets.forEach((b, i) => {

    if (b.result === "WIN") {
      bankroll += b.stake * (b.odds - 1);
    }

    if (b.result === "LOSS") {
      bankroll -= b.stake;
    }

    curve.push({
      index: i,
      bankroll: round(bankroll)
    });
  });

  return curve;
}

/**
 * ⚽ 🏉 SPORT SPLIT
 */
function getSportSplit(bets) {

  const football = bets.filter(b => b.sport === "football").length;
  const rugby = bets.filter(b => b.sport === "rugby").length;

  return { football, rugby };
}

/**
 * 🎯 DECISION SPLIT
 */
function getDecisionSplit(bets) {

  const value = bets.filter(b => b.decision === "VALUE BET").length;
  const noBet = bets.filter(b => b.decision === "NO BET").length;

  return { value, noBet };
}

function round(v) {
  return Math.round(v * 100) / 100;
}