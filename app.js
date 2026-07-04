import { loadDrawHunterData } from "./modules/drawhunter.js";
import { loadFrenchFlairData } from "./modules/frenchflair.js";

/**
 * INIT SPORTLAB V1.1
 */
async function init() {

  const app = document.getElementById("app");

  app.innerHTML = `
    <h1>🏟️ SportLab V1.1 AI System</h1>
    <p>Loading data...</p>
  `;

  try {

    // ⚽ FOOTBALL (DrawHunter)
    const football = await loadDrawHunterData();

    // 🏉 RUGBY (FrenchFlair)
    const rugby = await loadFrenchFlairData();

    // 🔥 RENDER FINAL DASHBOARD
    render(app, football, rugby);

  } catch (error) {
    console.error("SportLab error:", error);

    app.innerHTML = `
      <h1>❌ Error loading SportLab</h1>
      <p>${error.message}</p>
    `;
  }
}

/**
 * DASHBOARD RENDER
 */
function render(app, football, rugby) {

  app.innerHTML = `
    <h1>🏟️ SportLab V1.1 AI Dashboard</h1>

    <hr/>

    <h2>⚽ DrawHunter (Football AI)</h2>
    <pre>${formatData(football)}</pre>

    <hr/>

    <h2>🏉 FrenchFlair (Rugby AI)</h2>
    <pre>${formatData(rugby)}</pre>

    <hr/>

    <p>🧠 AI Layer: ACTIVE</p>
    <p>📊 Value detection enabled</p>
    <p>⚙️ System: V1.1 CLEAN</p>
  `;
}

/**
 * FORMAT SAFE DISPLAY
 */
function formatData(data) {
  try {
    return JSON.stringify(data, null, 2);
  } catch (e) {
    return "Invalid data format";
  }
}

// 🚀 START APP
init();
