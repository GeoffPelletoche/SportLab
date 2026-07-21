// services/frenchFlairService.js

import {
  loadFrenchFlairMatches
} from "../modules/frenchflair.js";

/**
 * SPORTLAB V6.3.1 — FRENCHFLAIR SERVICE
 *
 * Point d'accès unique aux données FrenchFlair.
 *
 * Responsabilités :
 * - charger les matchs rugby ;
 * - sécuriser la structure du payload ;
 * - garantir la présence de matches et meta ;
 * - laisser SportLab continuer à fonctionner
 *   même si le chargement rugby échoue.
 */

export async function getFrenchFlairPayload() {
  try {
    const payload =
      await loadFrenchFlairMatches();

    return normalizeFrenchFlairPayload(
      payload
    );
  } catch (error) {
    console.error(
      "[FrenchFlairService] Échec du chargement :",
      error
    );

    return createEmptyPayload(error);
  }
}

function normalizeFrenchFlairPayload(payload) {
  const matches =
    Array.isArray(payload?.matches)
      ? payload.matches
      : [];

  const meta =
    payload?.meta &&
    typeof payload.meta === "object"
      ? payload.meta
      : {};

  return {
    matches,

    meta: {
      ...meta,

      visibleTotal:
        toFiniteNumber(
          meta.visibleTotal,
          matches.length
        ),

      hiddenTotal:
        toFiniteNumber(
          meta.hiddenTotal,
          0
        )
    }
  };
}

function createEmptyPayload(error) {
  return {
    matches: [],

    meta: {
      visibleTotal: 0,
      hiddenTotal: 0,
      error: true,
      errorMessage:
        error?.message ||
        "Erreur inconnue lors du chargement FrenchFlair."
    }
  };
}

function toFiniteNumber(
  value,
  fallback = 0
) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
}