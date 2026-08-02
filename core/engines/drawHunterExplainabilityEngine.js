/**
 * SPORTLAB V11.1.1 — EXPLAINABLE AI DRAWHUNTER
 *
 * Ce moteur explique uniquement les indicateurs déjà présents dans
 * l'analyse DrawHunter affichée. Il ne déclenche aucun appel API et ne
 * recalc​​ule pas l'historique.
 *
 * Compatibilité :
 * - analyses V11 complètes ;
 * - analyses déjà calculées avant V11, même si predictionStatus n'a pas
 *   été conservé ;
 * - indicateurs partiels pouvant être reconstruits depuis homeStats et
 *   awayStats.
 */
export function explainDrawHunterPrediction(match = {}, bookmakerOdds = null) {
  const probability = firstFinite(
    match.probability,
    match.drawProbability,
    match.modelProbability
  );

  const fairOdds = probability > 0
    ? 1 / probability
    : firstFinite(match.fairOdds, match.modelOdds);

  const homeStats = isObject(match.homeStats) ? match.homeStats : {};
  const awayStats = isObject(match.awayStats) ? match.awayStats : {};

  const drawProfile = resolveAverageIndicator(
    match.drawProfile,
    homeStats.drawRate,
    awayStats.drawRate
  );

  const lowScoringProfile = resolveAverageIndicator(
    match.lowScoringProfile,
    homeStats.lowScoringRate,
    awayStats.lowScoringRate
  );

  const balance = resolveBalance(match.balance, homeStats, awayStats);

  const homeGames = firstFinite(homeStats.games, match.homeHistoryGames);
  const awayGames = firstFinite(awayStats.games, match.awayHistoryGames);
  const homeEffective = firstFinite(homeStats.effectiveGames, homeGames);
  const awayEffective = firstFinite(awayStats.effectiveGames, awayGames);
  const effectiveGames = homeEffective + awayEffective;
  const minimumGames = Math.min(homeGames, awayGames);

  /*
   * Ne pas dépendre uniquement de predictionStatus : cette propriété
   * pouvait ne pas être persistée dans certaines analyses antérieures,
   * alors que la probabilité et les statistiques calculées étaient bien
   * disponibles.
   */
  const hasModelEstimate = probability > 0;
  const hasComputedIndicators = [drawProfile, lowScoringProfile, balance]
    .some(value => Number.isFinite(value));
  const hasTeamStats = homeGames > 0 || awayGames > 0 || effectiveGames > 0;
  const statusExplicitlyValid = String(match.predictionStatus || "")
    .toUpperCase() === "OK";

  const available = statusExplicitlyValid || (
    hasModelEstimate && (hasComputedIndicators || hasTeamStats)
  );

  if (!available) {
    return {
      available: false,
      summary: "Explication indisponible : aucun indicateur déjà calculé n’est présent pour cette rencontre.",
      factors: []
    };
  }

  const safeDrawProfile = clamp(toFinite(drawProfile), 0, 1);
  const safeLowScoringProfile = clamp(toFinite(lowScoringProfile), 0, 1);
  const safeBalance = clamp(toFinite(balance), 0, 1);

  const factors = [
    createFactor({
      key: "draw-profile",
      label: "Tendance récente au match nul",
      value: safeDrawProfile,
      stars: scale(safeDrawProfile, 0.16, 0.38),
      tone: safeDrawProfile >= 0.27 ? "positive" : safeDrawProfile >= 0.20 ? "neutral" : "caution",
      detail: Number.isFinite(drawProfile)
        ? `${percent(safeDrawProfile)} de nuls pondérés sur les historiques déjà calculés des deux équipes.`
        : "Le taux de nuls détaillé n’a pas été conservé, mais la probabilité globale du modèle reste disponible."
    }),
    createFactor({
      key: "low-scoring",
      label: "Profil de matchs serrés",
      value: safeLowScoringProfile,
      stars: scale(safeLowScoringProfile, 0.35, 0.75),
      tone: safeLowScoringProfile >= 0.58 ? "positive" : safeLowScoringProfile >= 0.45 ? "neutral" : "caution",
      detail: Number.isFinite(lowScoringProfile)
        ? `${percent(safeLowScoringProfile)} des matchs pondérés se terminent avec deux buts ou moins.`
        : "Le profil de score détaillé n’a pas été conservé dans cette analyse."
    }),
    createFactor({
      key: "balance",
      label: "Équilibre attaque / défense",
      value: safeBalance,
      stars: scale(safeBalance, 0.35, 0.90),
      tone: safeBalance >= 0.68 ? "positive" : safeBalance >= 0.50 ? "neutral" : "caution",
      detail: Number.isFinite(balance)
        ? safeBalance >= 0.68
          ? "Les niveaux offensifs et défensifs récents sont proches."
          : safeBalance >= 0.50
            ? "L’écart de niveau reste modéré."
            : "Un écart de niveau réduit la probabilité d’un nul."
        : "Le détail attaque / défense n’a pas été conservé dans cette analyse."
    }),
    createFactor({
      key: "sample",
      label: "Fiabilité de l’échantillon",
      value: effectiveGames,
      stars: scale(effectiveGames, 12, 42),
      tone: effectiveGames >= 28 && minimumGames >= 10
        ? "positive"
        : effectiveGames >= 18
          ? "neutral"
          : "caution",
      detail: effectiveGames > 0
        ? `${round(effectiveGames, 1)} matchs effectifs pondérés, avec au moins ${Math.round(minimumGames)} matchs par équipe.`
        : `Confiance du modèle : ${Math.round(firstFinite(match.confidence, 0))}/100.`
    }),
    createBookmakerFactor(bookmakerOdds, fairOdds)
  ];

  const positiveCount = factors.filter(factor => factor.tone === "positive").length;
  const cautionCount = factors.filter(factor => factor.tone === "caution").length;

  return {
    available: true,
    fairOdds: fairOdds ? round(fairOdds, 2) : null,
    summary: positiveCount >= 3
      ? "Plusieurs indicateurs déjà calculés convergent en faveur d’un match nul."
      : cautionCount >= 3
        ? "Le modèle détecte peu de signaux favorables au match nul."
        : "Les indicateurs sont partagés : la cote bookmaker reste déterminante.",
    factors
  };
}

export function explainBookmakerPrice(probability, bookmakerOdds) {
  const numericProbability = toFinite(probability);
  const fairOdds = numericProbability > 0 ? 1 / numericProbability : null;
  return createBookmakerFactor(bookmakerOdds, fairOdds);
}

function resolveAverageIndicator(explicitValue, homeValue, awayValue) {
  const explicit = optionalFinite(explicitValue);
  if (explicit !== null) return explicit;

  const values = [optionalFinite(homeValue), optionalFinite(awayValue)]
    .filter(value => value !== null);

  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function resolveBalance(explicitValue, homeStats, awayStats) {
  const explicit = optionalFinite(explicitValue);
  if (explicit !== null) return explicit;

  const homeAttack = optionalFinite(homeStats.averageGoalsFor);
  const awayAttack = optionalFinite(awayStats.averageGoalsFor);
  const homeDefense = optionalFinite(homeStats.averageGoalsAgainst);
  const awayDefense = optionalFinite(awayStats.averageGoalsAgainst);

  if ([homeAttack, awayAttack, homeDefense, awayDefense].some(value => value === null)) {
    return null;
  }

  const attackGap = Math.abs(homeAttack - awayAttack);
  const defenseGap = Math.abs(homeDefense - awayDefense);
  return 1 - clamp((attackGap + defenseGap) / 4, 0, 1);
}

function createBookmakerFactor(bookmakerOdds, fairOdds) {
  const odds = toFinite(bookmakerOdds);

  if (!(odds > 1) || !(fairOdds > 1)) {
    return createFactor({
      key: "bookmaker-price",
      label: "Prix proposé par le bookmaker",
      value: null,
      stars: 0,
      tone: "pending",
      detail: "Saisis la cote bookmaker pour comparer son prix à la cote juste du modèle."
    });
  }

  const gap = odds / fairOdds - 1;
  return createFactor({
    key: "bookmaker-price",
    label: "Prix proposé par le bookmaker",
    value: gap,
    stars: scale(gap, -0.04, 0.10),
    tone: gap >= 0.01 ? "positive" : gap >= -0.01 ? "neutral" : "caution",
    detail: `Cote bookmaker ${odds.toFixed(2)} contre cote juste ${fairOdds.toFixed(2)} (${signedPercent(gap)}).`
  });
}

function createFactor({ key, label, value, stars, tone, detail }) {
  return {
    key,
    label,
    value,
    stars: clamp(Math.round(stars), 0, 5),
    tone,
    detail
  };
}

function scale(value, minimum, maximum) {
  if (!Number.isFinite(value) || maximum <= minimum) return 0;
  return clamp(((value - minimum) / (maximum - minimum)) * 4 + 1, 1, 5);
}

function percent(value) {
  return `${(toFinite(value) * 100).toFixed(1)}%`;
}

function signedPercent(value) {
  const number = toFinite(value) * 100;
  return `${number >= 0 ? "+" : ""}${number.toFixed(1)}%`;
}

function optionalFinite(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function firstFinite(...values) {
  for (const value of values) {
    const number = optionalFinite(value);
    if (number !== null) return number;
  }
  return 0;
}

function toFinite(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(toFinite(value) * factor) / factor;
}
