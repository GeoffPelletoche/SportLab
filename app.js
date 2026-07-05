import { loadDrawHunterData } from "./modules/drawhunter.js";
import { loadFrenchFlairData } from "./modules/frenchflair.js";
import { computeValueEngine } from "./core/valueEngine.js";
import { addBet } from "./core/betsStore.js";

let drawMatches = [];
let rugbyMatches = [];

async function init() {
  const app = document.getElementById("app");

  app.innerHTML = "<h2>Loading SportLab...</h2>";

  try {
    const drawhunter = await loadDrawHunterData();
    const frenchflair = await loadFrenchFlairData();

    drawMatches = drawhunter.matches || [];
    rugbyMatches = frenchflair.matches || [];

    render();
  } catch (e) {
    console.error(e);
    app.innerHTML = `<h1>Erreur SportLab</h1><pre>${e.message}</pre>`;
  }
}

function render() {
  const app = document.getElementById("app");

  app.innerHTML = `
    <h1>🏟️ SportLab</h1>

    <hr/>

    <h2>⚽ DrawHunter — Match nul</h2>
    ${drawMatches.map((m, i) => `
      <div style="border:1px solid #ccc;padding:10px;margin:10px 0;">
        <h3>${m.home} vs ${m.away}</h3>
        <p>Ligue : ${m.league}</p>
        <p>Cote nul : ${m.odds}</p>
        <p>Value : ${m.value}</p>
        <p>Edge : ${m.edge}</p>
        <h3>${m.decision}</h3>

        ${m.decision === "VALUE BET" ? `
          <label>
            <input type="checkbox" id="drawPlaced-${i}">
            Pari placé
          </label>
          <br/><br/>
          <input id="drawStake-${i}" type="number" placeholder="Montant misé">
          <br/><br/>
          <button onclick="saveDrawBet(${i})">Valider le pari</button>
        ` : `
          <p>Statut : NON_PLACED</p>
        `}
      </div>
    `).join("")}

    <hr/>

    <h2>🏉 FrenchFlair — Over / Under</h2>
    ${rugbyMatches.map((m, i) => `
      <div style="border:1px solid #ccc;padding:10px;margin:10px 0;">
        <h3>${m.home} vs ${m.away}</h3>
        <p>Compétition : ${m.league}</p>
        <p>Tendance proposée : <strong>${m.trend}</strong></p>
        <p>Indice de confiance : ${m.confidence}%</p>
        <p>Total attendu : ${m.expectedPoints} pts</p>

        <input id="rugbyLine-${i}" type="number" step="0.5" placeholder="Ligne bookmaker">
        <br/><br/>
        <input id="rugbyOdds-${i}" type="number" step="0.01" placeholder="Cote ${m.trend}">
        <br/><br/>
        <button onclick="analyseRugbyValue(${i})">Analyser la value</button>

        <div id="rugbyResult-${i}" style="margin-top:10px;"></div>
      </div>
    `).join("")}
  `;
}

window.saveDrawBet = async function(index) {
  const match = drawMatches[index];
  const placed = document.getElementById(`drawPlaced-${index}`).checked;
  const stake = Number(document.getElementById(`drawStake-${index}`).value || 0);

  await addBet({
    source: "DrawHunter",
    sport: "football",
    match: `${match.home} vs ${match.away}`,
    market: "DRAW",
    line: null,
    odds: match.odds,
    confidence: 0,
    decision: match.decision,
    placed,
    stake
  });

  alert("Pari DrawHunter sauvegardé");
};

window.analyseRugbyValue = function(index) {
  const match = rugbyMatches[index];

  const line = Number(document.getElementById(`rugbyLine-${index}`).value);
  const odds = Number(document.getElementById(`rugbyOdds-${index}`).value);

  if (!line || !odds) {
    alert("Saisis la ligne bookmaker et la cote");
    return;
  }

  const modelProb = match.confidence / 100;
  const impliedProb = 1 / odds;

  const analysis = computeValueEngine({
    ...match,
    odds,
    modelProb,
    impliedProb,
    sport: "rugby"
  });

  const box = document.getElementById(`rugbyResult-${index}`);

  box.innerHTML = `
    <hr/>
    <p>Ligne : ${line}</p>
    <p>Marché : ${match.trend}</p>
    <p>Cote : ${odds}</p>
    <p>Value : ${analysis.value}</p>
    <p>Edge : ${analysis.edge}</p>
    <h3>${analysis.decision}</h3>

    ${analysis.decision === "VALUE BET" ? `
      <label>
        <input type="checkbox" id="rugbyPlaced-${index}">
        Pari placé
      </label>
      <br/><br/>
      <input id="rugbyStake-${index}" type="number" placeholder="Montant misé">
      <br/><br/>
      <button onclick="saveRugbyBet(${index}, ${line}, ${odds}, '${analysis.decision}')">
        Valider le pari
      </button>
    ` : `
      <p>Statut : NON_PLACED</p>
    `}
  `;
};

window.saveRugbyBet = async function(index, line, odds, decision) {
  const match = rugbyMatches[index];
  const placed = document.getElementById(`rugbyPlaced-${index}`).checked;
  const stake = Number(document.getElementById(`rugbyStake-${index}`).value || 0);

  await addBet({
    source: "FrenchFlair",
    sport: "rugby",
    match: `${match.home} vs ${match.away}`,
    market: match.trend,
    line,
    odds,
    confidence: match.confidence,
    decision,
    placed,
    stake
  });

  alert("Pari FrenchFlair sauvegardé");
};

init();