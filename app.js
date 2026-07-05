import { loadDrawHunterData } from "./modules/drawhunter.js";
import { loadFrenchFlairData } from "./modules/frenchflair.js";
import { computeValueEngine } from "./core/valueEngine.js";
import { getAnalytics } from "./core/roiAnalytics.js";
import { addBet } from "./core/betsStore.js";

/**
 * 🧠 SPORTLAB V2.3 ANALYSIS VIEW
 * - interactive match analysis
 * - value engine click-based
 * - bet creation manual
 */

let globalMatches = [];

async function init() {

  const app = document.getElementById("app");

  app.innerHTML = `<h1>🏟️ SportLab Analysis Mode</h1><p>Loading matches...</p>`;

  try {

    const football = await loadDrawHunterData();
    const rugby = await loadFrenchFlairData();

    globalMatches = [
      ...(football?.matches || football?.response || []),
      ...(rugby?.matches || rugby?.response || [])
    ];

    render(app, globalMatches);

  } catch (e) {

    console.error(e);

    app.innerHTML = `<h1>❌ Error loading SportLab</h1>`;
  }
}

/**
 * 📊 MAIN UI
 */
function render(app, matches) {

  app.innerHTML = `
    <h1>🏟️ SportLab Analysis View</h1>

    <hr/>

    <h2>⚽ Matches</h2>

    <div id="matchList">
      ${matches.map((m, i) => `
        <div class="match" data-i="${i}" style="cursor:pointer;padding:8px;border-bottom:1px solid #ddd">
          <strong>${m.home || m.teams?.home?.name || "Team A"}
          vs
          ${m.away || m.teams?.away?.name || "Team B"}</strong>
          <br/>
          Odds: ${m.odds || "-"}
        </div>
      `).join("")}
    </div>

    <hr/>

    <h2>🧠 Analysis</h2>
    <div id="analysisBox">
      <p>Select a match to analyse</p>
    </div>
  `;

  document.querySelectorAll(".match").forEach(el => {

    el.addEventListener("click", () => {

      const match = matches[el.dataset.i];

      showAnalysis(match);
    });
  });
}

/**
 * 🧠 ANALYSIS PANEL
 */
function showAnalysis(match) {

  const analysis = computeValueEngine({
    home: match.home || match.teams?.home?.name,
    away: match.away || match.teams?.away?.name,
    odds: match.odds || 2,
    league: match.league || "unknown",
    sport: match.sport || "football"
  });

  const box = document.getElementById("analysisBox");

  box.innerHTML = `
    <h3>${analysis.home} vs ${analysis.away}</h3>

    <p>🏆 League: ${analysis.league}</p>
    <p>💰 Odds: ${analysis.odds}</p>

    <hr/>

    <p>📊 Value: ${analysis.value}</p>
    <p>📈 Edge: ${analysis.edge}</p>

    <h2>🎯 Decision: ${analysis.decision}</h2>

    <button id="betBtn">
      ➕ Create Bet
    </button>
  `;

  document.getElementById("betBtn").onclick = async () => {

    const bet = {
      source: "AnalysisView",
      sport: analysis.sport,
      match: `${analysis.home} vs ${analysis.away}`,
      odds: analysis.odds,
      stake: 10,
      decision: analysis.decision,
      result: "PENDING"
    };

    await addBet(bet);

    alert("✅ Bet created");

    console.log("BET:", bet);
  };
}

/**
 * 🚀 START APP
 */
init();