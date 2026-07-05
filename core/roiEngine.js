const API = "https://sportlab-api-bridge.xxx.workers.dev";

/**
 * 📥 LOAD BETS FROM BACKEND
 */
export async function getBets() {

  try {
    const res = await fetch(`${API}/bets`);
    return await res.json();
  } catch {
    return JSON.parse(localStorage.getItem("sportlab_bets")) || [];
  }
}

/**
 * 💾 SAVE BETS (SYNC KV + LOCAL)
 */
export async function saveBets(bets) {

  localStorage.setItem("sportlab_bets", JSON.stringify(bets));

  try {
    await fetch(`${API}/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bets)
    });
  } catch (e) {
    console.warn("Backend sync failed, fallback local only");
  }
}

/**
 * 💰 ROI CALC
 */
export function getROI(bets) {

  let profit = 0;
  let invested = 0;
  let wins = 0;

  bets.forEach(b => {

    if (b.decision !== "VALUE BET") return;

    invested += b.stake;

    if (b.result === "WIN") {
      profit += b.stake * (b.odds - 1);
      wins++;
    }

    if (b.result === "LOSS") {
      profit -= b.stake;
    }
  });

  return {
    totalBets: bets.length,
    wins,
    profit: round(profit),
    roi: invested ? round((profit / invested) * 100) : 0
  };
}

function round(v) {
  return Math.round(v * 100) / 100;
}