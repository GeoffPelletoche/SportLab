import { calculateValueBet } from "../core/valueEngine.js";

export async function loadFrenchFlairData() {

  const matches = [
    {
      home: "France",
      away: "New Zealand",
      odds: 1.80
    },
    {
      home: "England",
      away: "South Africa",
      odds: 1.95
    }
  ];

  const enriched = matches.map(m =>
    calculateValueBet(m, "rugby")
  );

  return {
    status: "VALUE_ENGINE_ACTIVE",
    matches: enriched
  };
}
