const STORAGE_KEY = "sportlab_bets_v3";

export function getBets() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

export function updateBetSettlement(betId, settlement, game = {}) {
    const allowedResults = ["WON", "LOST", "PUSH"];
    const normalizedSettlement = String(settlement || "")
        .trim()
        .toUpperCase();

    if (!betId) {
        console.warn("[BetsStore] Identifiant de pari manquant.");
        return null;
    }

    if (!allowedResults.includes(normalizedSettlement)) {
        console.warn(
            `[BetsStore] Résultat non autorisé : ${normalizedSettlement}`
        );

        return null;
    }

    const bets = getBets();

    if (!Array.isArray(bets)) {
        return null;
    }

    const betIndex = bets.findIndex(bet => bet.id === betId);

    if (betIndex === -1) {
        console.warn(
            `[BetsStore] Pari introuvable : ${betId}`
        );

        return null;
    }

    const currentBet = bets[betIndex];

    /*
     * Un pari déjà réglé ne doit jamais être modifié
     * lors d'une nouvelle synchronisation.
     */
    if (
        currentBet.result &&
        currentBet.result !== "PENDING"
    ) {
        return currentBet;
    }

    const updatedBet = {
        ...currentBet,

        result: normalizedSettlement,
        settledAt: Date.now(),

        finalStatus: game.status || null,
        finalHomePoints: toNullableNumber(game.homePoints),
        finalAwayPoints: toNullableNumber(game.awayPoints),
        finalTotalPoints: toNullableNumber(game.totalPoints)
    };

    bets[betIndex] = updatedBet;

    saveBets(bets);

    window.dispatchEvent(
        new CustomEvent("sportlab:bets-updated", {
            detail: {
                betId,
                result: normalizedSettlement
            }
        })
    );

    return updatedBet;
}

function toNullableNumber(value) {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return null;
    }

    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : null;
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