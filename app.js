import { loadDrawHunterData } from "./modules/drawhunter.js";
import { loadFrenchFlairData } from "./modules/frenchflair.js";

/**
 * 🧠 SPORTLAB CLEAN STABLE V1 FIX
 * - NO BLANK SCREEN GUARANTEE
 * - SAFE MODULE ISOLATION
 */

async function init() {

  const app = document.getElementById("app");

  // 🟢 IMMÉDIAT UI (ANTI PAGE BLANCHE)
  app.innerHTML = `
    <h1>🏟️ SportLab V1 SAFE MODE</h1>
    <p>Loading modules...</p>
  `;

  let football = null;
  let rugby = null;

  // ⚽ FOOTBALL SAFE LOAD
  try {
    football = await loadDrawHunterData();
  } catch (e) {
    console.error("DrawHunter crash:", e);
    football = {
      status: "ERROR_SAFE_FALLBACK",
      matches: []
    };
  }

  // 🏉 RUGBY SAFE LOAD
  try {
    rugby = await loadFrenchFlairData();
  } catch (e) {
    console.error("FrenchFlair crash:", e);
    rugby = {
      status: "ERROR_SAFE_FALLBACK",
      matches: []
    };
  }

  // 💥 SAFE RENDER (JAMAIS DE FAIL)
  render(app, football, rugby);
}

/**
 * 📊 SAFE RENDER ENGINE
 */
function render(app, football, rugby) {

  app.innerHTML = `
    <h1>🏟️ SportLab V1 SAFE MODE</h1>

    <hr/>

    <h2>⚽ DrawHunter</h2>
    <p>Status: ${football?.status || "unknown"}</p>
    <p>Matches: ${football?.matches?.length || 0}</p>

    <hr/>

    <h2>🏉 FrenchFlair</h2>
    <p>Status: ${rugby?.status || "unknown"}</p>
    <p>Matches: ${rugby?.matches?.length || 0}</p>

    <hr/>

    <h2>🧠 SYSTEM HEALTH</h2>
    <p>UI: OK</p>
    <p>Football module: ${football?.status?.includes("ERROR") ? "❌" : "✅"}</p>
    <p>Rugby module: ${rugby?.status?.includes("ERROR") ? "❌" : "✅"}</p>
  `;
}

// 🚀 START SAFE MODE
init();