import { getBets } from "./betsStore.js";

export function getAnalytics() {

  const betsRaw = getBetsSyncSafe();

  const bets = Array.isArray(betsRaw) ? betsRaw : [];

  let profit = 0;
  let wins = 0;
  let losses = 0;
  let invested = 0;

  bets.forEach((b) => {

    if (b.decision !== "VALUE BET") return;

    invested += Number(b.stake || 0);

    if (b.result === "WIN") {
      profit += Number(b.stake) * (Number(b.odds) - 1);
      wins++;
    }

    if (b.result === "LOSS") {
      profit -= Number(b.stake);
      losses++;
    }
  });

  const roi = invested > 0 ? (profit / invested) * 100 : 0;

  return {
    roi: {
      profit: Number(profit.toFixed(2)),
      roi: Number(roi.toFixed(2)),
      wins,
      losses,
      invested
    }
  };
}

/**
 * 🧠 SAFE SYNC WRAPPER
 * évite crash async / API fail
 */
function getBetsSyncSafe() {
  try {

    const raw = localStorage.getItem("sportlab_bets");

    if (!raw) return [];

    return JSON.parse(raw);

  } catch (e) {
    return [];
  }
}