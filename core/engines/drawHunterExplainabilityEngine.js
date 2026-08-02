/**
 * SPORTLAB V11.1 — EXPLAINABLE AI DRAWHUNTER
 *
 * Ce moteur explique les indicateurs déjà calculés par DrawHunter.
 * Il ne modifie ni la probabilité, ni la confiance, ni la décision.
 */
export function explainDrawHunterPrediction(match = {}, bookmakerOdds = null) {
  const probability = toFinite(match.probability);
  const fairOdds = probability > 0 ? 1 / probability : null;
  const homeStats = match.homeStats || {};
  const awayStats = match.awayStats || {};
  const enoughHistory = String(match.predictionStatus || "").toUpperCase() === "OK";

  if (!enoughHistory) {
    return {
      available: false,
      summary: "Explication indisponible : l’historique est insuffisant pour interpréter le modèle.",
      factors: []
    };
  }

  const drawProfile = clamp(toFinite(match.drawProfile), 0, 1);
  const lowScoringProfile = clamp(toFinite(match.lowScoringProfile), 0, 1);
  const balance = clamp(toFinite(match.balance), 0, 1);
  const effectiveGames = toFinite(homeStats.effectiveGames) + toFinite(awayStats.effectiveGames);
  const minimumGames = Math.min(toFinite(homeStats.games), toFinite(awayStats.games));

  const factors = [
    createFactor({
      key: "draw-profile",
      label: "Tendance récente au match nul",
      value: drawProfile,
      stars: scale(drawProfile, 0.16, 0.38),
      tone: drawProfile >= 0.27 ? "positive" : drawProfile >= 0.20 ? "neutral" : "caution",
      detail: `${percent(drawProfile)} de nuls pondérés sur les historiques des deux équipes.`
    }),
    createFactor({
      key: "low-scoring",
      label: "Profil de matchs serrés",
      value: lowScoringProfile,
      stars: scale(lowScoringProfile, 0.35, 0.75),
      tone: lowScoringProfile >= 0.58 ? "positive" : lowScoringProfile >= 0.45 ? "neutral" : "caution",
      detail: `${percent(lowScoringProfile)} des matchs pondérés se terminent avec deux buts ou moins.`
    }),
    createFactor({
      key: "balance",
      label: "Équilibre attaque / défense",
      value: balance,
      stars: scale(balance, 0.35, 0.90),
      tone: balance >= 0.68 ? "positive" : balance >= 0.50 ? "neutral" : "caution",
      detail: balance >= 0.68
        ? "Les niveaux offensifs et défensifs récents sont proches."
        : balance >= 0.50
          ? "L’écart de niveau reste modéré."
          : "Un écart de niveau réduit la probabilité d’un nul."
    }),
    createFactor({
      key: "sample",
      label: "Fiabilité de l’échantillon",
      value: effectiveGames,
      stars: scale(effectiveGames, 12, 42),
      tone: effectiveGames >= 28 && minimumGames >= 10 ? "positive" : effectiveGames >= 18 ? "neutral" : "caution",
      detail: `${round(effectiveGames, 1)} matchs effectifs pondérés, avec au moins ${Math.round(minimumGames)} matchs par équipe.`
    }),
    createBookmakerFactor(bookmakerOdds, fairOdds)
  ];

  const positiveCount = factors.filter(factor => factor.tone === "positive").length;
  const cautionCount = factors.filter(factor => factor.tone === "caution").length;

  return {
    available: true,
    fairOdds: fairOdds ? round(fairOdds, 2) : null,
    summary: positiveCount >= 3
      ? "Plusieurs indicateurs convergent en faveur d’un match nul."
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

function toFinite(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(toFinite(value) * factor) / factor;
}
