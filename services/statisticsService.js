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


function normalizeResult(value) {
  const result = String(value ?? "").trim().toUpperCase();
  if (result === "WIN") return "WON";
  if (result === "LOSS") return "LOST";
  return result || "PENDING";
}

function betProfit(bet) {
  const result = normalizeResult(bet?.result || bet?.finalStatus);
  const stake = Math.max(Number(bet?.stake) || 0, 0);
  const odds = Math.max(Number(bet?.odds) || 0, 0);
  if (result === "WON") return stake * (odds - 1);
  if (result === "LOST") return -stake;
  return 0;
}

function buildPortfolioTimeline(bets) {
  return bets
    .filter(bet => bet?.placed === true && ["WON", "LOST", "PUSH"].includes(normalizeResult(bet?.result || bet?.finalStatus)))
    .map(bet => ({
      timestamp: Number(bet?.settledAt) || Date.parse(bet?.matchDate || "") || Number(bet?.createdAt) || 0,
      profit: betProfit(bet),
      source: normalizeLabel(bet?.source),
      sport: normalizeLabel(bet?.sport)
    }))
    .filter(item => item.timestamp > 0)
    .sort((a, b) => a.timestamp - b.timestamp);
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

    timeline:
      buildPortfolioTimeline(bets),

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