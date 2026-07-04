import { CONFIG } from "../core/config.js";

/**
 * SAFE + API LAYER DRAW HUNTER
 */
export async function loadDrawHunterData() {

  // 🟢 SAFE fallback (toujours dispo)
  const safeData = {
    status: "SAFE_MODE",
    matches: [
      {
        home: "PSG",
        away: "Marseille",
        league: "Ligue 1",
        prediction: "DRAW",
        value: 0.12,
        edge: 0.08,
        odds: 3.10
      }
    ]
  };

  try {

    // 🌐 API CALL VIA WORKER
    const res = await fetch(
      `${CONFIG.baseUrl}/fixtures?league=39&season=2024`
    );

    if (!res.ok) throw new Error("API error");

    const data = await res.json();

    // 🧠 transformation simple API → format SportLab
    const apiMatches = (data.response || []).slice(0, 5).map(m => {

      return {
        home: m.teams?.home?.name,
        away: m.teams?.away?.name,
        league: "API",
        prediction: "DRAW",
        value: Math.random() * 0.2, // placeholder safe value engine
        edge: Math.random() * 0.1,
        odds: 3.0
      };
    });

    return {
      status: "API_MODE",
      matches: apiMatches.length ? apiMatches : safeData.matches
    };

  } catch (e) {
    console.warn("DrawHunter API fallback:", e.message);
    return safeData;
  }
}