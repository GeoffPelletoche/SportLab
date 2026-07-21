// services/drawHunterService.js

import {
  loadDrawHunterMatches
} from "../modules/drawhunter.js";

/**
 * SPORTLAB V6.3.1 — DRAWHUNTER SERVICE
 *
 * Point d'accès unique aux données DrawHunter.
 *
 * Responsabilités :
 * - charger les matchs DrawHunter ;
 * - sécuriser la structure du payload ;
 * - garantir la présence de matches et meta ;
 * - ne contenir aucune logique d'affichage.
 */

export async function getDrawHunterPayload() {
  try {
    const payload =
      await loadDrawHunterMatches();

    return normalizeDrawHunterPayload(
      payload
    );
  } catch (error) {
    console.error(
      "[DrawHunterService] Échec du chargement :",
      error
    );

    /*
     * On renvoie un payload vide mais valide afin
     * que le reste de SportLab puisse continuer
     * à s'afficher.
     */
    return createEmptyPayload(error);
  }
}

function normalizeDrawHunterPayload(payload) {
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
        "Erreur inconnue lors du chargement DrawHunter."
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