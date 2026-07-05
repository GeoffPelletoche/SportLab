import { loadDrawHunterData } from "./modules/drawhunter.js";
import { loadFrenchFlairData } from "./modules/frenchflair.js";
import { computeValueEngine } from "./core/valueEngine.js";

/**
 * 🧠 SPORTLAB SAFE CORE V1
 * - zero crash mode
 * - fallback data safe
 * - engine protected
 */

async function init() {
  const app = document.getElementById("app");

  if (!app) {
    console.error("❌ #app container missing");
    return;
  }

  app.innerHTML = "<h2>🏟️ SportLab Loading SAFE MODE...</h2>";

  console.log("🚀 SPORTLAB INIT");

  let football = [];
  let rugby = [];

  // ⚽ DRAW HUNTER SAFE LOAD
  try {
    console.log("⚽ Loading DrawHunter...");
    football = await loadDrawHunterData() || [];
    console.log("⚽ DrawHunter OK");
  } catch (e) {
    console.error("❌ DrawHunter error:", e);
    football = [];
  }

  // 🏉 FRENCH FLAIR SAFE LOAD
  try {
    console.log("🏉 Loading FrenchFlair...");
    rugby = await loadFrenchFlairData() || [];
    console.log("🏉 FrenchFlair OK");
  } catch (e) {
    console.error("❌ FrenchFlair error:", e);
    rugby = [];
  }

  // 🧠 SAFE ENRICHMENT (NO CRASH IF ENGINE FAILS)
  football = safeValueEngine(football);
  rugby = safeValueEngine(rugby);

  render(app, football, rugby);
}

/**
 * 🧠 VALUE ENGINE WRAPPER SAFE
 */
function safeValueEngine(matches) {
  if (!Array.isArray(matches)) return [];

  return matches.map(match => {
    try {
      if (typeof computeValueEngine === "function") {
        return computeValueEngine(match);
      }

      return fallbackMatch(match);

    } catch (e) {
      console.error("Engine error:", e);
      return fallbackMatch(match);
    }
  });
}

/**
 * 🧱 FALLBACK SAFE MATCH
 */
function fallbackMatch(match) {
  return {
    ...match,
    value: 0,
    edge: 0,
    decision: "NO DATA",
    strategy: "SAFE_MODE"
  };
}

/**
 * 🎨 SAFE RENDER
 */
function render(app, football, rugby) {

  const f = Array.isArray(football) ? football : [];
  const r = Array.isArray(rugby) ? rugby : [];

  app.innerHTML = `
    <h1>🏟️ SportLab V1 SAFE CORE</h1>

    <hr/>

    <h2>⚽ DrawHunter (${f.length})</h2>
    <pre>${safeJSON(f)}</pre>

    <hr/>

    <h2>🏉 FrenchFlair (${r.length})</h2>
    <pre>${safeJSON(r)}</pre>

    <hr/>

    <h3>🧠 SYSTEM STATUS</h3>
    <p>Core: SAFE ACTIVE</p>
    <p>Football: ${f.length} matches</p>
    <p>Rugby: ${r.length} matches</p>
  `;
}

/**
 * 🧾 SAFE JSON
 */
function safeJSON(data) {
  try {
    return JSON.stringify(data, null, 2);
  } catch (e) {
    return "Invalid data format";
  }
}

// 🚀 START APP
init();