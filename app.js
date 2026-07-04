import { loadDrawHunterData } from "./modules/drawhunter.js";

async function init() {

  const app = document.getElementById("app");

  app.innerHTML = "<h1>Loading SportLab...</h1>";

  const data = await loadDrawHunterData();

  render(app, data);
}

function render(app, data) {

  app.innerHTML = `
    <h1>🏟️ SportLab SAFE + API</h1>

    <p>Status: ${data.status}</p>

    <h3>Matches</h3>

    <pre>${JSON.stringify(data.matches, null, 2)}</pre>
  `;
}

init();