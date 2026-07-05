const API = "https://sportlab-api-bridge.geoffrey-pelletier.workers.dev";

/**
 * 🧠 AUTO SETTLEMENT ENGINE V1
 */

export async function runSettlement() {

  try {

    const res = await fetch(`${API}/bets`);
    const bets = await res.json();

    const updated = await Promise.all(
      bets.map(async (bet) => {

        // ⛔ skip déjà résolus
        if (bet.result !== "PENDING") return bet;

        const outcome = await checkMatchResult(bet);

        return {
          ...bet,
          result: outcome
        };
      })
    );

    // 💾 save back to cloud
    await fetch(`${API}/bets/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated)
    });

    return updated;

  } catch (e) {
    console.error("Settlement error:", e);
    return [];
  }
}

/**
 * ⚽ CHECK MATCH RESULT (API SIMPLIFIÉE)
 */
async function checkMatchResult(bet) {

  try {

    // ⚠️ ici on simule endpoint API-Sports déjà connecté via worker
    const res = await fetch(`${API}/fixtures/result?match=${encodeURIComponent(bet.match)}`);

    const data = await res.json();

    if (!data || !data.response) return "PENDING";

    const homeScore = data.response.home;
    const awayScore = data.response.away;

    const [home, away] = bet.match.split(" vs ");

    if (homeScore > awayScore && bet.match.includes(home)) {
      return "WIN";
    }

    if (homeScore < awayScore && bet.match.includes(away)) {
      return "WIN";
    }

    if (homeScore === awayScore) {
      return "DRAW";
    }

    return "LOSS";

  } catch (e) {
    console.warn("Match check failed:", e);
    return "PENDING";
  }
}