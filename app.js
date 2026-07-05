import { loadDrawHunterData } from "./modules/drawhunter.js";
import { loadFrenchFlairData } from "./modules/frenchflair.js";

async function init() {
  const app = document.getElementById("app");

  if (!app) {
    console.error("Missing #app container");
    return;
  }

  app.innerHTML = "<h2>Loading SportLab...</h2>";

  try {
    console.log("Step 1: Loading DrawHunter");
    const football = await loadDrawHunterData();

    console.log("Step 2: Loading FrenchFlair");
    const rugby = await loadFrenchFlairData();

    console.log("Step 3: Render");

    render(app, football || [], rugby || []);

  } catch (error) {
    console.error("SPORTLAB CRASH:", error);

    app.innerHTML = `
      <h1>❌ SportLab Safe Mode</h1>
      <pre>${error.message}</pre>
    `;
  }
}

function render(app, football, rugby) {
  app.innerHTML = `
    <h1>🏟️ SportLab V1 (STABLE CORE)</h1>

    <h2>⚽ DrawHunter</h2>
    <pre>${safeJson(football)}</pre>

    <h2>🏉 FrenchFlair</h2>
    <pre>${safeJson(rugby)}</pre>

    <h3>🧠 SYSTEM STATUS</h3>
    <p>CORE: ACTIVE</p>
    <p>ENGINE: LOADED</p>
  `;
}

function safeJson(data) {
  try {
    return JSON.stringify(data, null, 2);
  } catch (e) {
    return "Invalid data";
  }
}

init();