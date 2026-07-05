import { computeValue } from "../core/valueEngine.js";

/**
 * SPORTLAB V3 — DRAWHUNTER MODULE
 * Rôle unique :
 * fournir les matchs foot à analyser sur le marché DRAW.
 */

export async function loadDrawHunterMatches() {
  const matches = [
    {
      id: "dh-1",
      home: "PSG",
      away: "Marseille",
      competition: "Ligue 1",
      drawOdds: 3.1,
      drawProbability: 0.34
    },
    {
      id: "dh-2",
      home: "Real Madrid",
      away: "Barcelona",
      competition: "La Liga",
      drawOdds: 3.4,
      drawProbability: 0.33
    },
    {
      id: "dh-3",
      home: "Bayern",
      away: "Dortmund",
      competition: "Bundesliga",
      drawOdds: 3.2,
      drawProbability: 0.3
    }
  ];

  return matches.map(match => {
    const value = computeValue({
      probability: match.drawProbability,
      odds: match.drawOdds,
      minValue: 0.01
    });

    return {
      ...match,
      source: "DrawHunter",
      sport: "football",
      market: "DRAW",
      odds: match.drawOdds,
      probability: match.drawProbability,
      ...value
    };
  });
}