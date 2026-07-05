import { loadDrawHunterData } from "./modules/drawhunter.js";
import { loadFrenchFlairData } from "./modules/frenchflair.js";
import { computeValueEngine } from "./core/valueEngine.js";

console.log("🚀 SPORTLAB JS RUNNING");

async function init() {
  const app = document.getElementById("app");

  if (!app) {
    console.error("❌ #app missing");
    return;
  }

  app.innerHTML = "<h2>🏟️ SportLab Loading...</h2>";

  let football = [];
  let rugby = [];

  try {
    const dh = await loadDrawHunterData();
    football = dh?.matches || [];
    console.log("⚽ DrawHunter OK:", football.length);
  } catch (e) {
    console.error("DrawHunter error", e);
  }

  try {
    const ff = await loadFrenchFlairData();
    rugby = ff?.matches || [];
    console.log("🏉 FrenchFlair OK:", rugby.length);
  } catch (e) {
    console.error("FrenchFlair error", e);
  }

  football = enrichMatches(football);
  rugby = enrichMatches(rugby);

  render(app, football, rugby);
}

/**
 * 🧠 VALUE ENGINE SAFE WRAPPER
 */
function enrichMatches(matches) {
  if (!Array.isArray(matches)) return [];

  return matches.map(match => {
    try {

      // 🔥 FIX CRITIQUE: inject probabilités manquantes
      const enrichedMatch = {
        ...match,

        modelProb: 0.33,
        impliedProb: 1 / (match.odds || 2)
      };

      return computeValueEngine(enrichedMatch);

    } catch (e) {
      console.error("Engine error:", e);
      return fallback(match);
    }
  });
}

/**
 * 🧱 FALLBACK SAFE
 */
function fallback(match) {
  return {
    ...match,
    value: 0,
    edge: 0,
    decision: "NO DATA",
    strategy: "SAFE_MODE"
  };
}

/**
 * 🎨 UI RENDER
 */
function render(app, football, rugby) {
  app.innerHTML = `
    <h1>🏟️ SportLab V1.1</h1>

    <hr/>

    <h2>⚽ DrawHunter (${football.length})</h2>
    <pre>${format(football)}</pre>

    <hr/>

    <h2>🏉 FrenchFlair (${rugby.length})</h2>
    <pre>${format(rugby)}</pre>

    <hr/>

    <h3>🧠 STATUS</h3>
    <p>Engine: ACTIVE</p>
    <p>Football: ${football.length}</p>
    <p>Rugby: ${rugby.length}</p>
  `;
}

/**
 * 📦 SAFE JSON
 */
function format(data) {
  try {
    return JSON.stringify(data, null, 2);
  } catch (e) {
    return "format error";
  }
}

// 🚀 START
init();