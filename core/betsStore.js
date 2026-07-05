const API = "https://sportlab-api-bridge.geoffrey-pelletier.workers.dev";
const KEY = "sportlab_bets";

/**
 * 📥 GET BETS (CLOUD FIRST)
 */
export async function getBets() {

  try {
    const res = await fetch(`${API}/bets`);
    return await res.json();
  } catch (e) {
    console.warn("Cloud offline → fallback localStorage");
    return JSON.parse(localStorage.getItem(KEY)) || [];
  }
}

/**
 * 💾 SAVE BETS (CLOUD FIRST)
 */
export async function saveBets(bets) {

  try {
    await fetch(`${API}/bets/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bets)
    });

    // backup local (cache only)
    localStorage.setItem(KEY, JSON.stringify(bets));

  } catch (e) {
    console.warn("Cloud save failed → local only fallback");
    localStorage.setItem(KEY, JSON.stringify(bets));
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