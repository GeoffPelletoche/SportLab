import { computeValueEngine } from "../core/valueEngine.js";

export async function loadDrawHunterData() {
  const matches = [
    {
      id: 1,
      home: "PSG",
      away: "Marseille",
      league: "Ligue 1",
      odds: 3.10,
      modelProb: 0.34,
      impliedProb: 1 / 3.10,
      sport: "football"
    },
    {
      id: 2,
      home: "Real Madrid",
      away: "Barcelona",
      league: "La Liga",
      odds: 3.40,
      modelProb: 0.33,
      impliedProb: 1 / 3.40,
      sport: "football"
    },
    {
      id: 3,
      home: "Bayern",
      away: "Dortmund",
      league: "Bundesliga",
      odds: 3.20,
      modelProb: 0.30,
      impliedProb: 1 / 3.20,
      sport: "football"
    }
  ];

  const analysed = matches.map(match => ({
    ...computeValueEngine(match),
    source: "DrawHunter",
    market: "DRAW"
  }));

  return {
    status: "DRAWHUNTER_READY",
    matches: analysed
  };
}