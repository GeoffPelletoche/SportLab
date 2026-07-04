import { calculateValueBet } from "../core/valueEngine.js";

/**
 * 🏉 FRENCHFLAIR V1.3 ADVANCED VALUE ENGINE
 * - Rugby value betting system
 * - SAFE + API READY
 * - SportLab unified engine
 */

export async function loadFrenchFlairData() {

  try {

    // 🧪 BASE RUGBY MATCH DATA (SAFE / MOCK INIT)
    const matches = [
      {
        id: 1,
        home: "France",
        away: "New Zealand",
        league: "International XV",
        odds: 1.85
      },
      {
        id: 2,
        home: "England",
        away: "South Africa",
        league: "International XV",
        odds: 1.95
      },
      {
        id: 3,
        home: "Toulouse",
        away: "Leinster",
        league: "Champions Cup",
        odds: 1.72
      },
      {
        id: 4,
        home: "Racing 92",
        away: "La Rochelle",
        league: "Top 14",
        odds: 2.05
      }
    ];

    // 🧠 VALUE ENGINE APPLY (RUGBY MODE)
    const enrichedMatches = matches.map(match => {

      const result = calculateValueBet(match, "rugby");

      return {
        ...match,
        ...result,
        strategy: "FRENCHFLAIR",
        sport: "rugby"
      };
    });

    // 📊 STATS VALUE BETS
    const valueBets = enrichedMatches.filter(m => m.value > 0.05);

    return {
      status: "VALUE_ENGINE_V1_3_ACTIVE",
      sport: "rugby",
      strategy: "frenchflair",
      totalMatches: matches.length,
      valueBets: valueBets.length,
      matches: enrichedMatches
    };

  } catch (error) {

    console.error("FrenchFlair error:", error);

    // 🟡 SAFE FALLBACK
    return {
      status: "SAFE_MODE_FALLBACK",
      sport: "rugby",
      matches: []
    };
  }
}
