import { analyzeRugbyTrend } from "../core/rugbyTrendEngine.js";

export async function loadFrenchFlairData() {
  const matches = [
    {
      id: 1,
      home: "France",
      away: "New Zealand",
      league: "International XV",
      homeAvgPoints: 29,
      awayAvgPoints: 27
    },
    {
      id: 2,
      home: "Toulouse",
      away: "Leinster",
      league: "Champions Cup",
      homeAvgPoints: 31,
      awayAvgPoints: 28
    },
    {
      id: 3,
      home: "Racing 92",
      away: "La Rochelle",
      league: "Top 14",
      homeAvgPoints: 23,
      awayAvgPoints: 21
    }
  ];

  const analysed = matches.map(match => ({
    ...analyzeRugbyTrend(match),
    source: "FrenchFlair",
    sport: "rugby"
  }));

  return {
    status: "FRENCHFLAIR_READY",
    matches: analysed
  };
}