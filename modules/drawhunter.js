import { calculateValueBet } from "../core/valueEngine.js";

/**
 * ⚽ DRAWHUNTER V1.3 ADVANCED VALUE ENGINE
 * - Football draw strategy
 * - API SAFE READY
 * - Value Betting Engine integrated
 */

export async function loadDrawHunterData() {

  try {

    // 🧪 BASE MATCH DATA (peut être remplacé par API plus tard)
    const matches = [
      {
        id: 1,
        home: "PSG",
        away: "Marseille",
        league: "Ligue 1",
        odds: 3.10
      },
      {
        id: 2,
        home: "Real Madrid",
        away: "Barcelona",
        league: "La Liga",
        odds: 3.40
      },
      {
        id: 3,
        home: "Bayern",
        away: "Dortmund",
        league: "Bundesliga",
        odds: 3.20
      },
      {
        id: 4,
        home: "Liverpool",
        away: "Arsenal",
        league: "Premier League",
        odds: 3.25
      }
    ];

    // 🧠 VALUE ENGINE APPLY
    const enrichedMatches = matches.map(match => {

      const result = calculateValueBet(match, "football");

      return {
        ...match,
        ...result,
        strategy: "DRAWHUNTER",
        sport: "football"
      };
    });

    // 📊 STATS ENGINE
    const valueBets = enrichedMatches.filter(m => m.value > 0.05);

    return {
      status: "VALUE_ENGINE_V1_3_ACTIVE",
      sport: "football",
      strategy: "draw_hunter",
      totalMatches: matches.length,
      valueBets: valueBets.length,
      matches: enrichedMatches
    };

  } catch (error) {

    console.error("DrawHunter error:", error);

    // 🟡 SAFE FALLBACK
    return {
      status: "SAFE_MODE_FALLBACK",
      sport: "football",
      matches: []
    };
  }
}