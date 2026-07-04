import { loadDrawHunterData } from "./modules/drawhunter.js";
import { loadFrenchFlairData } from "./modules/frenchflair.js";
import { computeROI } from "./core/roi.js";

async function init() {

  const football = await loadDrawHunterData();
  const rugby = await loadFrenchFlairData();

  const app = document.getElementById("app");

  app.innerHTML = `
    <h2>⚽ DrawHunter (Football)</h2>
    <pre>${JSON.stringify(football, null, 2)}</pre>

    <h2>🏉 FrenchFlair (Rugby)</h2>
    <pre>${JSON.stringify(rugby, null, 2)}</pre>

    <h2>💰 ROI SYSTEM</h2>
    <p>Ready for bets integration</p>
  `;
}

init();
