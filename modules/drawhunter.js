export async function loadDrawHunterData() {

  // 🧪 données MOCK (sans API)
  const mockMatches = [
    {
      home: "PSG",
      away: "Marseille",
      league: "Ligue 1",
      prediction: "DRAW",
      value: 0.12,
      edge: 0.08,
      odds: 3.10
    },
    {
      home: "Real Madrid",
      away: "Barcelona",
      league: "La Liga",
      prediction: "DRAW",
      value: 0.18,
      edge: 0.11,
      odds: 3.40
    },
    {
      home: "Bayern",
      away: "Dortmund",
      league: "Bundesliga",
      prediction: "NO BET",
      value: -0.03,
      edge: -0.02,
      odds: 3.20
    }
  ];

  return {
    status: "SAFE_MODE",
    matches: mockMatches,
    summary: {
      total: mockMatches.length,
      valueBets: mockMatches.filter(m => m.value > 0.05).length
    }
  };
}