const STORAGE_KEY = "sportlab_bets";

/**
 * 💰 ADD BET
 */
export function addBet(bet) {

  const bets = getBets();

  const cleanBet = {
    id: generateId(),
    source: bet.source, // DrawHunter / FrenchFlair
    sport: bet.sport,
    match: bet.match,
    odds: Number(bet.odds),
    stake: Number(bet.stake || 0),
    decision: bet.decision, // VALUE / NO BET
    result: "PENDING", // WIN / LOSS / PENDING
    timestamp: Date.now()
  };

  bets.push(cleanBet);
  saveBets(bets);

  return cleanBet;
}

/**
 * 🧠 RESOLVE BET (WIN / LOSS)
 */
export function resolveBet(id, result) {

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
 * 📊 ROI CALCULATION
 */
export function getROI() {

  const bets = getBets();

  let profit = 0;
  let invested = 0;
  let wins = 0;

  bets.forEach(bet => {

    if (bet.decision !== "VALUE BET") return;

    invested += bet.stake;

    if (bet.result === "WIN") {
      profit += bet.stake * (bet.odds - 1);
      wins++;
    }

    if (bet.result === "LOSS") {
      profit -= bet.stake;
    }
  });

  const roi = invested ? (profit / invested) * 100 : 0;

  return {
    totalBets: bets.length,
    valueBets: bets.filter(b => b.decision === "VALUE BET").length,
    wins,
    profit: round(profit),
    roi: round(roi)
  };
}

/**
 * 🧠 HELPERS
 */
function getBets() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
}

function saveBets(bets) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bets));
}

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

function round(v) {
  return Math.round(v * 100) / 100;
}