/**
 * SPORTLAB V6.2 — STATISTICS SERVICE
 *
 * Produit les statistiques globales et les regroupements
 * utilisés par la page Portfolio.
 */

import {
  getAllBets
} from "./betService.js";

import {
  calculateROI
} from "../core/engines/roiEngine.js";

function normalizeLabel(value) {
  const label =
    String(value ?? "").trim();

  return label || "Non renseigné";
}

function groupBets(bets, getKey) {
  const groups = new Map();

  bets.forEach(bet => {
    const label =
      normalizeLabel(
        getKey(bet)
      );

    if (!groups.has(label)) {
      groups.set(label, []);
    }

    groups.get(label).push(bet);
  });

  return Array.from(
    groups.entries()
  )
    .map(([label, groupBetsList]) => ({
      label,
      ...calculateROI(groupBetsList)
    }))
    .sort((a, b) => {
      /*
       * Les groupes ayant le plus de mises réglées
       * apparaissent en premier.
       */
      return b.invested - a.invested;
    });
}

export function getAdvancedStatistics() {
  const bets = getAllBets();

  return {
    global:
      calculateROI(bets),

    bySport:
      groupBets(
        bets,
        bet => bet?.sport
      ),

    bySource:
      groupBets(
        bets,
        bet => bet?.source
      ),

    byCompetition:
      groupBets(
        bets,
        bet => bet?.competition
      ),

    byMarket:
      groupBets(
        bets,
        bet => bet?.market
      )
  };
}