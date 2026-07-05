/**
 * 🧠 SPORTLAB CENTRAL BET STORE (V2 CLEAN)
 * UNIQUE SOURCE OF TRUTH
 */

const KEY = "sportlab_bets";

/**
 * 📥 GET ALL BETS
 */
export function getBets() {
  return JSON.parse(localStorage.getItem(KEY)) || [];
}

/**
 * 💾 SAVE ALL BETS
 */
export function saveBets(bets) {
  localStorage.setItem(KEY, JSON.stringify(bets));
}

/**
 * ➕ ADD BET
 */
export function addBet(bet) {

  const bets = getBets();

  const cleanBet = {
    id: generateId(),
    source: bet.source,
    sport: bet.sport,
    match: bet.match,
    odds: Number(bet.odds),
    stake: Number(bet.stake || 0),
    decision: bet.decision,
    result: "PENDING",
    timestamp: Date.now()
  };

  bets.push(cleanBet);
  saveBets(bets);

  return cleanBet;
}

/**
 * 🧠 UPDATE RESULT (WIN / LOSS)
 */
export function updateBetResult(id, result) {

  const bets = getBets();

  const updated = bets.map(b => {
    if (b.id === id) {
      return { ...b, result };
    }
    return b;
  });

  saveBets(updated);
  return updated;
}

/**
 * 🧩 ID GENERATOR
 */
function generateId() {
  return Math.random().toString(36).substring(2, 10);
}