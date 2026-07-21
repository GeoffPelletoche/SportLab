// services/analysisService.js

import {
  getAnalyses as getStoredAnalyses,
  getAnalysisById as getStoredAnalysisById,
  getAnalysisForMatch as getStoredAnalysisForMatch
} from "../core/stores/analysisStore.js";

/**
 * SPORTLAB V6.3.1 — ANALYSIS SERVICE
 *
 * Point d'accès en lecture aux analyses sauvegardées.
 *
 * Responsabilités :
 * - lire les analyses depuis analysisStore ;
 * - garantir qu'un tableau est toujours retourné ;
 * - normaliser les propriétés utilisées par les autres services ;
 * - ne contenir aucune logique d'affichage.
 */

/**
 * Retourne toutes les analyses normalisées.
 */
export function getAnalyses() {
  const analyses = getStoredAnalyses();

  if (!Array.isArray(analyses)) {
    return [];
  }

  return analyses.map(normalizeAnalysis);
}

/**
 * Retourne une analyse par son identifiant.
 */
export function getAnalysisById(id) {
  if (!id) {
    return null;
  }

  const analysis = getStoredAnalysisById(id);

  return analysis
    ? normalizeAnalysis(analysis)
    : null;
}

/**
 * Retourne l'analyse associée à un match.
 */
export function getAnalysisForMatch(matchId) {
  if (
    matchId === undefined ||
    matchId === null ||
    matchId === ""
  ) {
    return null;
  }

  const analysis =
    getStoredAnalysisForMatch(matchId);

  return analysis
    ? normalizeAnalysis(analysis)
    : null;
}

/**
 * Retourne les analyses d'un module SportLab.
 *
 * Exemples :
 * - DrawHunter
 * - FrenchFlair
 */
export function getAnalysesBySource(source) {
  const normalizedSource =
    normalizeText(source).toLowerCase();

  if (!normalizedSource) {
    return [];
  }

  return getAnalyses().filter(
    analysis =>
      normalizeText(analysis.source)
        .toLowerCase() === normalizedSource
  );
}

/**
 * Retourne uniquement les analyses correspondant
 * à une décision donnée.
 *
 * Exemples :
 * - VALUE
 * - NO VALUE
 * - PENDING
 */
export function getAnalysesByDecision(decision) {
  const normalizedDecision =
    normalizeDecision(decision);

  if (!normalizedDecision) {
    return [];
  }

  return getAnalyses().filter(
    analysis =>
      normalizeDecision(
        analysis.decision
      ) === normalizedDecision
  );
}

/**
 * Normalise une analyse pour que les services puissent
 * utiliser une structure stable.
 *
 * Le store utilise actuellement :
 *
 * home
 * away
 *
 * tandis que certaines parties du Journal utilisent :
 *
 * homeTeam
 * awayTeam
 *
 * Le service expose donc les deux formes.
 */
function normalizeAnalysis(analysis = {}) {
  const home =
    normalizeText(
      analysis.home ??
      analysis.homeTeam
    );

  const away =
    normalizeText(
      analysis.away ??
      analysis.awayTeam
    );

  const match =
    normalizeText(analysis.match) ||
    buildMatchLabel(home, away);

  return {
    ...analysis,

    id:
      analysis.id ??
      "",

    source:
      normalizeText(analysis.source),

    sport:
      normalizeText(analysis.sport),

    competition:
      normalizeNullableText(
        analysis.competition
      ),

    matchId:
      analysis.matchId ?? null,

    match,

    home,
    away,

    /*
     * Alias utilisés par journalService.
     */
    homeTeam: home,
    awayTeam: away,

    date:
      analysis.date ?? null,

    market:
      normalizeNullableText(
        analysis.market
      ),

    line:
      toNullableNumber(
        analysis.line
      ),

    bookmaker:
      normalizeNullableText(
        analysis.bookmaker
      ),

    odds:
      toNumber(analysis.odds),

    probability:
      toNumber(analysis.probability),

    impliedProbability:
      toNumber(
        analysis.impliedProbability
      ),

    value:
      toNumber(analysis.value),

    edge:
      toNumber(analysis.edge),

    decision:
      normalizeDecision(
        analysis.decision
      ),

    placed:
      analysis.placed === true,

    stake:
      toNumber(analysis.stake),

    status:
      normalizeText(
        analysis.status
      ) || "draft",

    result:
      normalizeResult(
        analysis.result
      ),

    notes:
      normalizeText(
        analysis.notes
      ),

    scoreValue:
      toNumber(
        analysis.scoreValue
      ),

    finalDecision:
      normalizeNullableText(
        analysis.finalDecision
      ),

    confidence:
      toNumber(
        analysis.confidence
      ),

    sigma:
      toNumber(
        analysis.sigma
      ),

    predictedTotalPoints:
      toNumber(
        analysis.predictedTotalPoints
      ),

    modelEdgePoints:
      toNumber(
        analysis.modelEdgePoints
      ),

    modelEdgePercent:
      toNumber(
        analysis.modelEdgePercent
      ),

    createdAt:
      analysis.createdAt ?? null,

    updatedAt:
      analysis.updatedAt ?? null
  };
}

function buildMatchLabel(home, away) {
  if (home && away) {
    return `${home} vs ${away}`;
  }

  return home || away || "Match non renseigné";
}

function normalizeDecision(value) {
  const decision =
    normalizeText(value)
      .toUpperCase();

  if (
    decision === "NO_VALUE" ||
    decision === "NOVALUE"
  ) {
    return "NO VALUE";
  }

  return decision || "PENDING";
}

function normalizeResult(value) {
  const result =
    normalizeText(value)
      .toUpperCase();

  if (result === "WIN") {
    return "WON";
  }

  if (result === "LOSS") {
    return "LOST";
  }

  if (
    result === "WON" ||
    result === "LOST" ||
    result === "PUSH" ||
    result === "PENDING"
  ) {
    return result;
  }

  return "PENDING";
}

function normalizeText(value) {
  return String(
    value ?? ""
  ).trim();
}

function normalizeNullableText(value) {
  const text =
    normalizeText(value);

  return text || null;
}

function toNumber(value) {
  const number =
    Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
}

function toNullableNumber(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const number =
    Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}