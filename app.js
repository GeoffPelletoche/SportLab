import { loadDrawHunterData } from "./modules/drawhunter.js";
import { loadFrenchFlairData } from "./modules/frenchflair.js";
import { getROI } from "./core/roiEngine.js";

async function init() {

  const app = document.getElementById("app");

  app.innerHTML = `<h1>🏟️ SportLab ROI Dashboard</h1><p>Loading...</p>`;

  try {

    // ⚽ DATA
    const football = await loadDrawHunterData();
    const rugby = await loadFrenchFlairData();

    // 💰 ROI DATA
    const roi = getROI();

    render(app, football, rugby, roi);

  } catch (e) {

    console.error(e);

    app.innerHTML = `
      <h1>❌ Error loading SportLab</h1>
      <p>${e.message}</p>
    `;
  }
}

/**
 * 📊 DASHBOARD RENDER
 */
function render(app, football, rugby, roi) {

  app.innerHTML = `
    <h1>🏟️ SportLab ROI Dashboard</h1>

    <hr/>

    <h2>💰 GLOBAL PERFORMANCE</h2>

    <div style="padding:10px;border:1px solid #ccc;">
      <p>📊 Total bets: ${roi.totalBets}</p>
      <p>🎯 Value bets: ${roi.valueBets}</p>
      <p>🏆 Wins: ${roi.wins}</p>
      <p>💸 Profit: ${roi.profit} units</p>
      <p>📈 ROI: ${roi.roi}%</p>
    </div>

    <hr/>

    <h2>⚽ DrawHunter (Football)</h2>
    <p>Status: ${football.status}</p>
    <p>Value bets: ${football.valueBets}</p>

    <pre>${format(football.matches)}</pre>

    <hr/>

    <h2>🏉 FrenchFlair (Rugby)</h2>
    <p>Status: ${rugby.status}</p>
    <p>Value bets: ${rugby.valueBets}</p>

    <pre>${format(rugby.matches)}</pre>

    <hr/>

    <p>🧠 Engine: ACTIVE</p>
  `;
}

/**
 * 🧾 SAFE FORMAT
 */
function format(data) {
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return "Invalid data";
  }
}

init();