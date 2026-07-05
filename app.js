import { loadDrawHunterData } from "./modules/drawhunter.js";
import { loadFrenchFlairData } from "./modules/frenchflair.js";

/**
 * SPORTLAB V1 - STABLE CORE
 * ZERO SILENT FAIL
 */

async function init() {
  const app = document.getElementById("app");

  if (!app) {
    console.error("❌ Missing #app container");
    return;
  }

  app.innerHTML = "<h2>🏟️ SportLab Loading...</h2>";

  console.log("🚀 INIT SPORTLAB");

  let football = [];
  let rugby = [];

  try {
    console.log("⚽ Loading DrawHunter...");

    football = await loadDrawHunterData();

    console.log("⚽ DrawHunter OK:", football);

  } catch (e) {
    console.error("❌ DrawHunter error:", e);
  }

  try {
    console.log("🏉 Loading FrenchFlair...");

    rugby = await loadFrenchFlairData();

    console.log("🏉 FrenchFlair OK:", rugby);

  } catch (e) {
    console.error("❌ FrenchFlair error:", e);
  }

  render(app, football, rugby);
}

/**
 * RENDER SAFE (NO CRASH EVER)
 */
function render(app, football, rugby) {

  const f = Array.isArray(football) ? football : [];
  const r = Array.isArray(rugby) ? rugby : [];

  app.innerHTML = `
    <h1>🏟️ SportLab V1</h1>

    <hr/>

    <h2>⚽ DrawHunter (${f.length})</h2>
    <pre>${safeJSON(f)}</pre>

    <hr/>

    <h2>🏉 FrenchFlair (${r.length})</h2>
    <pre>${safeJSON(r)}</pre>

    <hr/>

    <h3>🧠 SYSTEM STATUS</h3>
    <p>Core: ACTIVE</p>
    <p>Football Engine: ${f.length > 0 ? "OK" : "EMPTY"}</p>
    <p>Rugby Engine: ${r.length > 0 ? "OK" : "EMPTY"}</p>
  `;
}

/**
 * SAFE JSON
 */
function safeJSON(data) {
  try {
    return JSON.stringify(data, null, 2);
  } catch (e) {
    return "Invalid data";
  }
}

/**
 * START APP
 */
init();