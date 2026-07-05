const API = "https://sportlab-api-bridge.geoffrey-pelletier.workers.dev";
const KEY = "sportlab_bets";

export async function getBets() {
  try {
    const res = await fetch(`${API}/bets`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  }
}

export async function saveBets(bets) {
  localStorage.setItem(KEY, JSON.stringify(bets));

  try {
    await fetch(`${API}/bets/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bets)
    });
  } catch {
    console.warn("Cloud sync failed, local backup used");
  }
}

export async function addBet(bet) {
  const bets = await getBets();

  const cleanBet = {
    id: crypto.randomUUID(),
    source: bet.source,
    sport: bet.sport,
    match: bet.match,
    market: bet.market,
    line: bet.line ?? null,
    odds: Number(bet.odds),
    confidence: Number(bet.confidence || 0),
    decision: bet.decision,
    placed: Boolean(bet.placed),
    stake: Number(bet.stake || 0),
    result: bet.placed ? "PENDING" : "NON_PLACED",
    timestamp: Date.now()
  };

  bets.push(cleanBet);
  await saveBets(bets);

  return cleanBet;
}