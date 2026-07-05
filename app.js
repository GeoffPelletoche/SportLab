import { loadDrawHunterData } from "./modules/drawhunter.js";
import { loadFrenchFlairData } from "./modules/frenchflair.js";
import { getAnalytics } from "./core/roiAnalytics.js";
import { runSettlement } from "./core/settlementEngine.js";

/**
 * 🧠 SPORTLAB V2.3 CLEAN (NO AUTO RUN)
 * - Manual settlement only
 * - Stable architecture
 * - No hidden execution
 */

async function init() {

  const app = document.getElementById("app");

  app.innerHTML = `
    <h1>🏟️ SportLab V2.3 Dashboard</h1>
    <p>Loading system...</p>
  `;

  try {

    // ⚽ LOAD FOOTBALL
    const football = await loadDrawHunterData();

    // 🏉 LOAD RUGBY
    const rugby = await loadFrenchFlairData();

    // 📊 ANALYTICS
    const analytics = getAnalytics();

    // 🎯 RENDER UI
    render(app, football, rugby, analytics);

  } catch (error) {

    console.error("SportLab error:", error);

    app.innerHTML = `
      <h1>❌ SportLab Error</h1>
      <p>${error.message}</p>
    `;
  }
}

/**
 * 📊 DASHBOARD RENDER
 */
function render(app, football, rugby, analytics) {

  app.innerHTML = `
    <h1>🏟️ SportLab V2.3 Dashboard</h1>

    <hr/>

    <h2>💰 ROI GLOBAL</h2>
    <p>Profit: ${analytics.roi.profit}</p>
    <p>ROI: ${analytics.roi.roi}%</p>
    <p>Wins: ${analytics.roi.wins}</p>

    <hr/>

    <h2>⚙️ ACTIONS</h2>

    <button onclick="runManualSettlement()">
      🔄 Settle Bets Now
    </button>

    <hr/>

    <h2>⚽ DrawHunter</h2>
    <p>Status: ${football.status}</p>
    <pre>${format(football.matches)}</pre>

    <hr/>

    <h2>🏉 FrenchFlair</h2>
    <p>Status: ${rugby.status}</p>
    <pre>${format(rugby.matches)}</pre>

    <hr/>

    <h2>📊 SYSTEM</h2>
    <p>Value Engine: ACTIVE</p>
    <p>ROI Engine: ACTIVE</p>
    <p>Cloud Sync: ACTIVE</p>
    <p>Settlement Mode: MANUAL</p>
  `;
}

/**
 * 🔄 MANUAL SETTLEMENT TRIGGER
 */
window.runManualSettlement = async function () {

  const app = document.getElementById("app");

  app.innerHTML += `<p>⏳ Running settlement...</p>`;

  try {

    const result = await runSettlement();

    alert("✅ Settlement completed: " + result.length + " bets updated");

    location.reload();

  } catch (e) {

    console.error(e);
    alert("❌ Settlement failed: " + e.message);
  }
};

/**
 * 🧾 SAFE FORMATTER
 */
function format(data) {
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return "Invalid data";
  }
}

// 🚀 START APP
init();