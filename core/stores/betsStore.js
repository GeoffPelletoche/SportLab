export const BETS_STORAGE_KEY = "sportlab_bets_v3";
const STORAGE_KEY = BETS_STORAGE_KEY;
const LEGACY_STORAGE_KEYS = ["sportlab_bets", "sportlab_bets_v1", "sportlab_bets_v2", "bets_v3"];

/**
 * Lit tous les paris enregistrés.
 */
export function getBets() {
  try {
    const canonical = parseBetArray(
      localStorage.getItem(STORAGE_KEY)
    );

    const legacy = LEGACY_STORAGE_KEYS.flatMap(key =>
      parseBetArray(localStorage.getItem(key))
    );

    const merged = deduplicateBets([
      ...canonical,
      ...legacy
    ]).map(normalizeStoredBet);

    /*
     * Une seule source de vérité : toute donnée historique encore
     * présente sous une ancienne clé est consolidée dans bets_v3.
     */
    if (
      legacy.length > 0 ||
      merged.length !== canonical.length
    ) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(merged)
      );
    }

    return merged;
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
  const bets = getBets();

  const cleanBet = {
    id: crypto.randomUUID(),

    analysisId: bet.analysisId || null,
    source: bet.source || null,
    sport: bet.sport || null,
    competition: bet.competition || null,

    matchId: bet.matchId ?? null,
    matchDate: bet.matchDate || null,

    match: bet.match || null,
    home: bet.home || bet.homeTeam || null,
    away: bet.away || bet.awayTeam || null,
    homeId: bet.homeId ?? null,
    awayId: bet.awayId ?? null,
    homeLogo: bet.homeLogo || null,
    awayLogo: bet.awayLogo || null,
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

  const existingIndex = bets.findIndex(item =>
    isSameBetIdentity(item, cleanBet) &&
    normalizeResult(item?.result) === "PENDING"
  );

  if (existingIndex >= 0) {
    cleanBet.id = bets[existingIndex].id;
    cleanBet.createdAt = bets[existingIndex].createdAt || cleanBet.createdAt;
    bets[existingIndex] = {
      ...bets[existingIndex],
      ...cleanBet
    };
  } else {
    bets.push(cleanBet);
  }

  const saved = saveBets(bets);

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

export function getBetStoreHealth() {
  const bets = getBets();
  const placed = bets.filter(bet => bet?.placed === true);
  const pending = placed.filter(
    bet => normalizeResult(bet?.result) === "PENDING"
  );

  return {
    storageKey: STORAGE_KEY,
    entries: bets.length,
    placed: placed.length,
    pending: pending.length,
    pendingStake: pending.reduce(
      (total, bet) => total + Math.max(Number(bet?.stake) || 0, 0),
      0
    ),
    duplicates: countDuplicateBets(bets),
    integrity: countDuplicateBets(bets) === 0 ? "OK" : "WARNING"
  };
}

function parseBetArray(raw) {
  if (!raw) return [];
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function normalizeStoredBet(bet = {}) {
  const placed = bet?.placed === true;
  return {
    ...bet,
    id: bet.id || globalThis.crypto?.randomUUID?.() || `bet-${Date.now()}-${Math.random()}`,
    analysisId: bet.analysisId || null,
    matchId: bet.matchId ?? null,
    placed,
    stake: Number(bet.stake || 0),
    odds: Number(bet.odds || 0),
    probability: Number(bet.probability || 0),
    value: Number(bet.value || 0),
    edge: Number(bet.edge || 0),
    result: normalizeResult(bet.result) || (placed ? "PENDING" : "NON_PLACED")
  };
}

function normalizeResult(value) {
  return String(value || "").trim().toUpperCase();
}

function betIdentity(bet = {}) {
  return [
    String(bet.source || "").toLowerCase(),
    String(bet.matchId ?? ""),
    String(bet.market || "").toLowerCase(),
    String(bet.line ?? "")
  ].join("|");
}

function isSameBetIdentity(first, second) {
  const firstIdentity = betIdentity(first);
  return firstIdentity !== "|||" && firstIdentity === betIdentity(second);
}

function deduplicateBets(bets) {
  const byId = new Map();
  const anonymous = [];

  bets.forEach(bet => {
    if (!bet || typeof bet !== "object") return;
    if (bet.id) {
      const previous = byId.get(String(bet.id));
      if (!previous || Number(bet.updatedAt || bet.createdAt || 0) >= Number(previous.updatedAt || previous.createdAt || 0)) {
        byId.set(String(bet.id), bet);
      }
    } else {
      anonymous.push(bet);
    }
  });

  const result = [...byId.values()];
  anonymous.forEach(bet => {
    if (!result.some(existing => isSameBetIdentity(existing, bet))) result.push(bet);
  });
  return result;
}

function countDuplicateBets(bets) {
  const seen = new Set();
  let duplicates = 0;
  bets.forEach(bet => {
    const key = bet.id ? `id:${bet.id}` : `identity:${betIdentity(bet)}`;
    if (seen.has(key)) duplicates += 1;
    else seen.add(key);
  });
  return duplicates;
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
