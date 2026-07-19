const STORAGE_KEY = "sportlab_bets_v3";

/**
 * Lit tous les paris enregistrés.
 */
export function getBets() {
  try {
    const storedBets = JSON.parse(
      localStorage.getItem(STORAGE_KEY)
    );

    return Array.isArray(storedBets)
      ? storedBets
      : [];
  } catch (error) {
    console.error(
      "[BetsStore] Impossible de lire les paris :",
      error
    );

    return [];
  }
}

/**
 * Écrit le tableau complet des paris.
 * Fonction interne au store.
 */
function saveBets(bets) {
  if (!Array.isArray(bets)) {
    console.warn(
      "[BetsStore] La sauvegarde attend un tableau."
    );

    return false;
  }

  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(bets)
    );
console.log(

      "[saveBets] Clé écrite :",

      STORAGE_KEY

    );

    console.log(

      "[saveBets] Valeur :",

      localStorage.getItem(STORAGE_KEY)

    );
    return true;
  } catch (error) {
    console.error(
      "[BetsStore] Impossible de sauvegarder les paris :",
      error
    );

    return false;
  }
}

/**
 * Ajoute un nouveau pari.
 */
export function saveBet(bet) {
  console.log("[saveBet] Entrée", bet);
  const bets = getBets();

  const cleanBet = {
    id: crypto.randomUUID(),

    source: bet.source || null,
    sport: bet.sport || null,
    competition: bet.competition || null,

    matchId: bet.matchId ?? null,
    matchDate: bet.matchDate || null,

    match: bet.match || null,
    market: bet.market || null,
    line: bet.line ?? null,

    odds: Number(bet.odds),
    probability: Number(bet.probability || 0),
    value: Number(bet.value || 0),
    edge: Number(bet.edge || 0),

    decision: bet.decision || null,
    placed: Boolean(bet.placed),
    stake: Number(bet.stake || 0),

    result: bet.placed
      ? "PENDING"
      : "NON_PLACED",

    createdAt: Date.now(),

    settledAt: null,
    finalStatus: null,
    finalHomePoints: null,
    finalAwayPoints: null,
    finalTotalPoints: null
  };

  bets.push(cleanBet);
  console.log("[saveBet] Avant saveBets", bets);

  const saved = saveBets(bets);
  console.log("[saveBet] saveBets =", saved);

  if (!saved) {
    return null;
  }

  dispatchBetsUpdated({
    type: "BET_CREATED",
    betId: cleanBet.id
  });

  return cleanBet;
}

/**
 * Enregistre le règlement automatique d’un pari.
 */
export function updateBetSettlement(
  betId,
  settlement,
  game = {}
) {
  const allowedResults = [
    "WON",
    "LOST",
    "PUSH"
  ];

  const normalizedSettlement = String(
    settlement || ""
  )
    .trim()
    .toUpperCase();

  if (!betId) {
    console.warn(
      "[BetsStore] Identifiant de pari manquant."
    );

    return null;
  }

  if (
    !allowedResults.includes(
      normalizedSettlement
    )
  ) {
    console.warn(
      `[BetsStore] Résultat non autorisé : ${normalizedSettlement}`
    );

    return null;
  }

  const bets = getBets();

  const betIndex = bets.findIndex(
    bet => bet.id === betId
  );

  if (betIndex === -1) {
    console.warn(
      `[BetsStore] Pari introuvable : ${betId}`
    );

    return null;
  }

  const currentBet = bets[betIndex];

  /*
   * Un pari déjà réglé ne doit pas être
   * modifié par une nouvelle synchronisation.
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

    finalHomePoints: toNullableNumber(
      game.homePoints
    ),

    finalAwayPoints: toNullableNumber(
      game.awayPoints
    ),

    finalTotalPoints: toNullableNumber(
      game.totalPoints
    )
  };

  bets[betIndex] = updatedBet;

  const saved = saveBets(bets);

  if (!saved) {
    return null;
  }

  dispatchBetsUpdated({
    type: "BET_SETTLED",
    betId,
    result: normalizedSettlement
  });

  return updatedBet;
}

/**
 * Mise à jour manuelle conservée pour
 * compatibilité avec le code existant.
 */
export function updateBetResult(id, result) {
  const allowedResults = [
    "PENDING",
    "WON",
    "LOST",
    "PUSH"
  ];

  const normalizedResult = String(result || "")
    .trim()
    .toUpperCase();

  if (!allowedResults.includes(normalizedResult)) {
    console.warn(
      `[BetsStore] Résultat invalide : ${normalizedResult}`
    );

    return null;
  }

  const bets = getBets();

  const betIndex = bets.findIndex(
    bet => bet.id === id
  );

  if (betIndex === -1) {
    console.warn(
      `[BetsStore] Pari introuvable : ${id}`
    );

    return null;
  }

  const updatedBet = {
    ...bets[betIndex],
    result: normalizedResult,
    settledAt:
      normalizedResult === "PENDING"
        ? null
        : Date.now()
  };

  bets[betIndex] = updatedBet;

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(bets)
  );

  window.dispatchEvent(
    new CustomEvent("sportlab:bets-updated", {
      detail: {
        betId: id,
        result: normalizedResult
      }
    })
  );

  return updatedBet;
}

/**
 * Supprime tous les paris.
 */
export function clearBets() {
  localStorage.removeItem(STORAGE_KEY);

  dispatchBetsUpdated({
    type: "BETS_CLEARED"
  });
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

function dispatchBetsUpdated(detail = {}) {
  window.dispatchEvent(
    new CustomEvent(
      "sportlab:bets-updated",
      {
        detail
      }
    )
  );
}
