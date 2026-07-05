const STORAGE_KEY = "sportlab_bets_v3";

export function getBets() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

export function saveBet(bet) {
  const bets = getBets();

  const cleanBet = {
    id: crypto.randomUUID(),
    source: bet.source,
    sport: bet.sport,
    competition: bet.competition || null,
    match: bet.match,
    market: bet.market,
    line: bet.line ?? null,
    odds: Number(bet.odds),
    probability: Number(bet.probability || 0),
    value: Number(bet.value || 0),
    edge: Number(bet.edge || 0),
    decision: bet.decision,
    placed: Boolean(bet.placed),
    stake: Number(bet.stake || 0),
    result: bet.placed ? "PENDING" : "NON_PLACED",
    createdAt: Date.now()
  };

  bets.push(cleanBet);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bets));

  return cleanBet;
}

export function updateBetResult(id, result) {
  const bets = getBets();

  const updated = bets.map(bet =>
    bet.id === id ? { ...bet, result } : bet
  );

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

  return updated;
}

export function clearBets() {
  localStorage.removeItem(STORAGE_KEY);
}