import { computeRugbyTrend } from "../core/rugbyTrendEngine.js";

/**
 * SPORTLAB V3 — FRENCHFLAIR MODULE
 * Rôle unique :
 * fournir les matchs rugby avec tendance OVER / UNDER.
 */

export async function loadFrenchFlairMatches() {
  const matches = [
    {
      id: "ff-1",
      home: "France",
      away: "New Zealand",
      competition: "International XV",
      homeAvgFor: 29,
      homeAvgAgainst: 21,
      awayAvgFor: 27,
      awayAvgAgainst: 23
    },
    {
      id: "ff-2",
      home: "Toulouse",
      away: "Leinster",
      competition: "Champions Cup",
      homeAvgFor: 31,
      homeAvgAgainst: 22,
      awayAvgFor: 28,
      awayAvgAgainst: 24
    },
    {
      id: "ff-3",
      home: "Racing 92",
      away: "La Rochelle",
      competition: "Top 14",
      homeAvgFor: 23,
      homeAvgAgainst: 24,
      awayAvgFor: 21,
      awayAvgAgainst: 22
    }
  ];

  return matches.map(match => ({
    ...computeRugbyTrend(match),
    source: "FrenchFlair",
    sport: "rugby"
  }));
}