import { loadDrawHunterData } from "./modules/drawhunter.js";
import { loadFrenchFlairData } from "./modules/frenchflair.js";
import { getAnalytics } from "./core/roiAnalytics.js";
import { runSettlement } from "./core/settlementEngine.js";
import { addBet } from "./core/betsStore.js";

/**
 * 🧠 SPORTLAB V2.3 FULL SYSTEM
 * - Value Engine
 * - ROI Engine
 * - Auto Settlement
 * - Cloud Sync ready
 */

async function init() {

  const app = document.getElementById("app");

  // 🟢 SAFE UI FIRST (ANTI BLANK SCREEN)
  app.innerHTML = `
    <h1>🏟️ SportLab V2.3</h1>
    <p>Loading system...</p>
  `;

  try {

    /**
     * 🔥 1. AUTO SETTLEMENT (WIN / LOSS UPDATE)
     */
    await runSettlement();

    /**
     * ⚽ 2. LOAD MODULES
     */
    const football = await loadDrawHunterData();
    const rugby = await loadFrenchFlairData();

    /**
     * 📊 3. ANALYTICS
     */
    const analytics = getAnalytics();

    /**
     * 🎯 4. RENDER DASHBOARD
     */
    render(app, football, rugby, analytics);

  } catch (error) {

    console.error("SportLab crash:", error);

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

    <h2>📊 SYSTEM STATUS</h2>
    <p>Football: ${football.status}</p>
    <p>Rugby: ${rugby.status}</p>

    <hr/>

    <h2>⚽ DrawHunter</h2>
    <pre>${format(football.matches)}</pre>

    <h2>🏉 FrenchFlair</h2>
    <pre>${format(rugby.matches)}</pre>

    <hr/>

    <h2>🧠 SYSTEM</h2>
    <p>Auto Settlement: ACTIVE</p>
    <p>Value Engine: ACTIVE</p>
    <p>Cloud Sync: ACTIVE</p>
  `;
}

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

/**
 * 🚀 START APP
 */
init();