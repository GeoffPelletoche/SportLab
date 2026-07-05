import { loadDrawHunterData } from "./modules/drawhunter.js";
import { loadFrenchFlairData } from "./modules/frenchflair.js";
import { getAnalytics } from "./core/roiAnalytics.js";

async function init() {

  const app = document.getElementById("app");

  app.innerHTML = `<h1>🏟️ SportLab ROI Analytics</h1><p>Loading...</p>`;

  try {

    const football = await loadDrawHunterData();
    const rugby = await loadFrenchFlairData();

    const analytics = getAnalytics();

    render(app, football, rugby, analytics);

  } catch (e) {
    console.error(e);
    app.innerHTML = "Error loading SportLab";
  }
}

/**
 * 📊 DASHBOARD
 */
function render(app, football, rugby, a) {

  app.innerHTML = `
    <h1>🏟️ SportLab ROI Analytics</h1>

    <hr/>

    <h2>💰 ROI GLOBAL</h2>
    <p>Profit: ${a.roi.profit}</p>
    <p>ROI: ${a.roi.roi}%</p>
    <p>Wins: ${a.roi.wins}</p>

    <hr/>

    <h2>📈 BANKROLL EVOLUTION</h2>
    <pre>${JSON.stringify(a.bankrollCurve, null, 2)}</pre>

    <hr/>

    <h2>⚽ VS 🏉 SPLIT</h2>
    <p>Football bets: ${a.sportSplit.football}</p>
    <p>Rugby bets: ${a.sportSplit.rugby}</p>

    <hr/>

    <h2>🎯 DECISIONS</h2>
    <p>Value Bets: ${a.decisionSplit.value}</p>
    <p>No Bets: ${a.decisionSplit.noBet}</p>

    <hr/>

    <h2>⚽ Football</h2>
    <pre>${JSON.stringify(football.matches, null, 2)}</pre>

    <h2>🏉 Rugby</h2>
    <pre>${JSON.stringify(rugby.matches, null, 2)}</pre>
  `;
}

init();