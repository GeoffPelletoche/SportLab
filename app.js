import { loadDrawHunterData } from "./modules/drawhunter.js";

async function init() {

  const app = document.getElementById("app");

  const data = await loadDrawHunterData();

  app.innerHTML = `
    <h1>🏟️ DrawHunter SAFE MODE</h1>

    <p>Status: ${data.status}</p>
    <p>Total matches: ${data.summary.total}</p>
    <p>Value bets: ${data.summary.valueBets}</p>

    <hr/>

    <h3>Matches</h3>

    <pre>${JSON.stringify(data.matches, null, 2)}</pre>
  `;
}

init();