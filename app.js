import { loadDrawHunterData } from "./modules/drawhunter.js";
import { loadFrenchFlairData } from "./modules/frenchflair.js";
import { computeValueEngine } from "./core/valueEngine.js";
import { getAnalytics } from "./core/roiAnalytics.js";
import { addBet, getBets } from "./core/betsStore.js";

/**
 * 🧠 SPORTLAB UI PRO DASHBOARD V1
 */

let matches = [];
let currentView = "analysis";

async function init() {

  const app = document.getElementById("app");

  app.innerHTML = `<h1>🏟️ SportLab Pro Dashboard</h1><p>Loading...</p>`;

  try {

    const football = await loadDrawHunterData();
    const rugby = await loadFrenchFlairData();

    matches = [
      ...(football?.matches || football?.response || []),
      ...(rugby?.matches || rugby?.response || [])
    ];

    render(app);

  } catch (e) {

    console.error(e);
    app.innerHTML = "❌ Error loading SportLab";
  }
}

/**
 * 📊 MAIN RENDER
 */
function render(app) {

  const analytics = getAnalytics();
  const bets = getBetsSync();

  app.innerHTML = `
    <h1>🏟️ SportLab Pro Dashboard V1</h1>

    <hr/>

    <h2>📊 ROI OVERVIEW</h2>
    <p>Profit: ${analytics.roi.profit}</p>
    <p>ROI: ${analytics.roi.roi}%</p>
    <p>Wins: ${analytics.roi.wins}</p>

    <hr/>

    <button onclick="switchView('analysis')">🧠 Analysis</button>
    <button onclick="switchView('portfolio')">📦 Portfolio</button>

    <hr/>

    ${currentView === "analysis" ? renderAnalysis() : renderPortfolio(bets)}
  `;
}

/**
 * 🧠 ANALYSIS VIEW
 */
function renderAnalysis() {

  return `
    <h2>⚽ Match Analysis</h2>

    <div>
      ${matches.map((m, i) => `
        <div onclick="analyze(${i})" style="cursor:pointer;padding:8px;border-bottom:1px solid #ddd">
          <strong>${getHome(m)} vs ${getAway(m)}</strong>
        </div>
      `).join("")}
    </div>

    <div id="analysisBox">
      <p>Select a match</p>
    </div>
  `;
}

/**
 * 📦 PORTFOLIO VIEW
 */
function renderPortfolio(bets) {

  return `
    <h2>📦 Bets Portfolio</h2>

    <table border="1" cellpadding="5">
      <tr>
        <th>Match</th>
        <th>Odds</th>
        <th>Stake</th>
        <th>Decision</th>
        <th>Result</th>
      </tr>

      ${bets.map(b => `
        <tr>
          <td>${b.match}</td>
          <td>${b.odds}</td>
          <td>${b.stake}</td>
          <td>${b.decision}</td>
          <td>${b.result}</td>
        </tr>
      `).join("")}

    </table>
  `;
}

/**
 * 🧠 ANALYZE MATCH
 */
window.analyze = function (i) {

  const m = matches[i];

  const analysis = computeValueEngine({
    home: getHome(m),
    away: getAway(m),
    odds: m.odds || 2,
    league: m.league || "unknown",
    sport: "football"
  });

  document.getElementById("analysisBox").innerHTML = `
    <h3>${analysis.home} vs ${analysis.away}</h3>

    <p>💰 Odds: ${analysis.odds}</p>
    <p>📊 Value: ${analysis.value}</p>
    <p>📈 Edge: ${analysis.edge}</p>

    <h2>🎯 ${analysis.decision}</h2>

    <button onclick='createBet(${JSON.stringify(analysis)})'>
      ➕ Create Bet
    </button>
  `;
};

/**
 * ➕ CREATE BET
 */
window.createBet = async function (analysis) {

  await addBet({
    source: "UI_PRO",
    sport: analysis.sport,
    match: `${analysis.home} vs ${analysis.away}`,
    odds: analysis.odds,
    stake: 10,
    decision: analysis.decision,
    result: "PENDING"
  });

  alert("Bet created ✔");
  render(document.getElementById("app"));
};

/**
 * 🔄 SWITCH VIEW
 */
window.switchView = function (view) {
  currentView = view;
  render(document.getElementById("app"));
};

/**
 * 🧠 SAFE GETTERS
 */
function getHome(m) {
  return m.home || m.teams?.home?.name || "Team A";
}

function getAway(m) {
  return m.away || m.teams?.away?.name || "Team B";
}

/**
 * 📥 SAFE BETS
 */
function getBetsSync() {
  try {
    return JSON.parse(localStorage.getItem("sportlab_bets")) || [];
  } catch {
    return [];
  }
}

// 🚀 INIT
init();