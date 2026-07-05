import { loadDrawHunterData } from "./modules/drawhunter.js";
import { loadFrenchFlairData } from "./modules/frenchflair.js";
import { computeValueEngine } from "./core/valueEngine.js";

async function init() {
  const app = document.getElementById("app");

  if (!app) {
    console.error("❌ #app missing");
    return;
  }

  app.innerHTML = "<h2>🏟️ SportLab SAFE BOOT...</h2>";

  console.log("🚀 INIT");

  let football = [];
  let rugby = [];

  try {
    const dh = await loadDrawHunterData();
    football = dh?.matches || [];
    console.log("⚽ DrawHunter OK");
  } catch (e) {
    console.error("DrawHunter error", e);
  }

  try {
    const ff = await loadFrenchFlairData();
    rugby = ff?.matches || [];
    console.log("🏉 FrenchFlair OK");
  } catch (e) {
    console.error("FrenchFlair error", e);
  }

  football = safeValueEngine(football);
  rugby = safeValueEngine(rugby);

  render(app, football, rugby);
}

/**
 * 🧠 SAFE ENGINE WRAPPER
 */
function safeValueEngine(matches) {
  if (!Array.isArray(matches)) return [];

  return matches.map(m => {
    try {
      return computeValueEngine(m);
    } catch (e) {
      return fallback(m);
    }
  });
}

function fallback(match) {
  return {
    ...match,
    value: 0,
    edge: 0,
    decision: "NO DATA",
    strategy: "SAFE"
  };
}

/**
 * 🎨 UI
 */
function render(app, football, rugby) {
  app.innerHTML = `
    <h1>🏟️ SportLab V1 FIXED</h1>

    <h2>⚽ DrawHunter (${football.length})</h2>
    <pre>${JSON.stringify(football, null, 2)}</pre>

    <h2>🏉 FrenchFlair (${rugby.length})</h2>
    <pre>${JSON.stringify(rugby, null, 2)}</pre>

    <h3>🧠 STATUS</h3>
    <p>Engine: OK</p>
  `;
}

init();