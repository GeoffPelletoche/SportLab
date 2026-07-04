const KEY = "sportlab_bets_v13";

export function getBets() {
  return JSON.parse(localStorage.getItem(KEY)) || [];
}

export function saveBets(bets) {
  localStorage.setItem(KEY, JSON.stringify(bets));
}

export function addBet(bet) {
  const bets = getBets();
  bets.push({
    ...bet,
    status: "EN_ATTENTE",
    createdAt: Date.now()
  });
  saveBets(bets);
}
