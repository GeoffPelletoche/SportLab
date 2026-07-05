import { loadDrawHunterData } from "./modules/drawhunter.js";
import { loadFrenchFlairData } from "./modules/frenchflair.js";
import { computeValueEngine } from "./core/valueEngine.js";
import { getAnalytics } from "./core/roiAnalytics.js";
import { addBet } from "./core/betsStore.js";

let app;
let matches = [];
let view = "analysis";

/**
 * 🚀 INIT SAFE MODE
 */
async function init() {

  app = document.getElementById("app");

  if (!app) {
    console.error("APP ROOT NOT FOUND");
    return;
  }

  app.innerHTML = `<h1>🏟️ SportLab Loading...</h1>`;

  try {

    console.log("Loading DrawHunter...");
    const football = await loadDrawHunterData();

    console.log("Loading FrenchFlair...");
    const rugby = await loadFrenchFlairData();

    matches = [
      ...(football?.matches || football?.response || []),
      ...(rugby?.matches || rugby?.response || [])
    ];

    console.log("Matches loaded:", matches.length);

    render();

  } catch (e) {

    console.error("SPORTLAB INIT ERROR:", e);

    app.innerHTML = `
      <h1>❌ SportLab Error</h1>
      <pre>${e.message}</pre>
    `;
  }
}

/**
 * 📊 MAIN RENDER (SAFE)
 */
function render() {

  const analytics = getAnalytics?.() || {
    roi: { profit: 0, roi: 0, wins: 0 }
  };

  app.innerHTML = `
    <h1>🏟️ SportLab V1 SAFE RESTORE</h1>

    <hr/>

    <h2>📊 ROI</h2>
    <p>Profit: ${analytics.roi.profit}</p>
    <p>ROI: ${analytics.roi.roi}%</p>
    <p>Wins: ${analytics.roi.wins}</p>

    <hr/>

    <button onclick="switchView('analysis')">🧠 Analysis</button>
    <button onclick="switchView('portfolio')">📦 Portfolio</button>

    <hr/>

    <div id="main">
      ${view === "analysis" ? renderAnalysis() : renderPortfolio()}
    </div>
  `;
}

/**
 * 🧠 ANALYSIS VIEW SAFE
 */
function renderAnalysis() {

  if (!matches.length) {
    return `<p>No matches loaded</p>`;
  }

  return `
    <h2>⚽ Matches</h2>

    ${matches.map((m, i) => `
      <div style="padding:8px;border-bottom:1px solid #ddd;cursor:pointer"
           onclick="analyzeMatch(${i})">
        <strong>${getHome(m)} vs ${getAway(m)}</strong>
        <br/>
        Odds: ${m.odds || "-"}
      </div>
    `).join("")}

    <hr/>

    <div id="analysisBox">
      <p>Select a match</p>
    </div>
  `;
}

/**
 * 📦 PORTFOLIO SAFE
 */
function renderPortfolio() {

  const bets = getBetsSafe();

  if (!bets.length) {
    return `<p>No bets yet</p>`;
  }

  return `
    <h2>📦 Bets</h2>

    <table border="1" cellpadding="6">
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
 * 🧠 ANALYZE MATCH SAFE
 */
window.analyzeMatch = function (i) {

  const m = matches[i];

  if (!m) return;

  const result = computeValueEngine({
    home: getHome(m),
    away: getAway(m),
    odds: m.odds || 2,
    league: m.league || "unknown",
    sport: "football"
  });

  document.getElementById("analysisBox").innerHTML = `
    <h3>${result.home} vs ${result.away}</h3>

    <p>💰 Odds: ${result.odds}</p>
    <p>📊 Value: ${result.value}</p>
    <p>📈 Edge: ${result.edge}</p>

    <h2>🎯 ${result.decision}</h2>

    <button onclick='createBet(${JSON.stringify(result)})'>
      ➕ Create Bet
    </button>
  `;
};

/**
 * ➕ CREATE BET SAFE
 */
window.createBet = async function (analysis) {

  try {

    await addBet({
      source: "SAFE_APP",
      match: `${analysis.home} vs ${analysis.away}`,
      odds: analysis.odds,
      stake: 10,
      decision: analysis.decision,
      result: "PENDING"
    });

    alert("Bet created ✔");

    render();

  } catch (e) {
    console.error("BET ERROR:", e);
  }
};

/**
 * 🔄 SWITCH VIEW SAFE
 */
window.switchView = function (v) {
  view = v;
  render();
};

/**
 * 🧠 SAFE HELPERS
 */
function getHome(m) {
  return m?.home || m?.teams?.home?.name || "Team A";
}

function getAway(m) {
  return m?.away || m?.teams?.away?.name || "Team B";
}

function getBetsSafe() {
  try {
    return JSON.parse(localStorage.getItem("sportlab_bets")) || [];
  } catch {
    return [];
  }
}

// 🚀 START
init();