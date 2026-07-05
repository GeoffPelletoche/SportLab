const API = "https://TON-WORKER-URL.workers.dev";
const KEY = "sportlab_bets";

/**
 * 📥 GET BETS (CLOUD + FALLBACK)
 */
export async function getBets() {

  try {
    const res = await fetch(`${API}/bets`);
    const data = await res.json();

    if (Array.isArray(data)) {
      return data;
    }

    throw new Error("invalid cloud data");

  } catch (e) {
    console.warn("Cloud fallback localStorage");
    return JSON.parse(localStorage.getItem(KEY)) || [];
  }
}

/**
 * 💾 SAVE BETS (CLOUD + LOCAL BACKUP)
 */
export async function saveBets(bets) {

  localStorage.setItem(KEY, JSON.stringify(bets));

  try {
    await fetch(`${API}/bets/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bets)
    });

  } catch (e) {
    console.warn("Cloud sync failed → local only");
  }
}

/**
 * ➕ ADD BET
 */
export async function addBet(bet) {

  const bets = await getBets();

  const cleanBet = {
    id: generateId(),
    source: bet.source,
    sport: bet.sport,
    match: bet.match,
    odds: bet.odds,
    stake: bet.stake,
    decision: bet.decision,
    result: "PENDING",
    timestamp: Date.now()
  };

  bets.push(cleanBet);

  await saveBets(bets);

  return cleanBet;
}

/**
 * 🧠 UPDATE RESULT
 */
export async function updateBetResult(id, result) {

  const bets = await getBets();

  const updated = bets.map(b =>
    b.id === id ? { ...b, result } : b
  );

  await saveBets(updated);

  return updated;
}

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}