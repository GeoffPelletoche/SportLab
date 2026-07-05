import { computeValueEngine } from "./core/valueEngine.js";

console.log("🧠 SPORTLAB ANALYSIS MODE V1");

function init() {
  const app = document.getElementById("app");

  if (!app) {
    console.error("❌ missing #app");
    return;
  }

  app.innerHTML = `
    <h1>🧠 SportLab Analysis Mode</h1>

    <div style="padding:10px; border:1px solid #ccc; margin-bottom:10px;">
      <h3>⚽ Match Analyzer</h3>

      <input id="home" placeholder="Home team" /><br/><br/>
      <input id="away" placeholder="Away team" /><br/><br/>
      <input id="odds" placeholder="Odds (ex: 3.2)" type="number" step="0.01"/><br/><br/>

      <button id="analyzeBtn">Analyze Value</button>
    </div>

    <div id="result" style="padding:10px; border:1px solid #000;">
      Awaiting analysis...
    </div>
  `;

  document.getElementById("analyzeBtn").onclick = runAnalysis;
}

function runAnalysis() {
  const home = document.getElementById("home").value;
  const away = document.getElementById("away").value;
  const odds = parseFloat(document.getElementById("odds").value);

  if (!home || !away || !odds) {
    alert("Please fill all fields");
    return;
  }

  const match = {
    home,
    away,
    odds,

    // 🧠 engine fallback inputs (IMPORTANT)
    modelProb: 0.33,
    impliedProb: 1 / odds,
    sport: "football",
    league: "manual"
  };

  const result = computeValueEngine(match);

  renderResult(result);
}

function renderResult(result) {
  const el = document.getElementById("result");

  const color =
    result.decision === "VALUE BET"
      ? "green"
      : "red";

  el.innerHTML = `
    <h2 style="color:${color}">
      ${result.decision}
    </h2>

    <p><b>${result.home} vs ${result.away}</b></p>

    <p>Odds: ${result.odds}</p>
    <p>Value: ${result.value}</p>
    <p>Edge: ${result.edge}</p>

    <hr/>

    <p><b>Strategy:</b> ${result.strategy}</p>
  `;
}

init();