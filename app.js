import { loadDrawHunterData } from "./modules/drawhunter.js";
import { loadFrenchFlairData } from "./modules/frenchflair.js";

async function init() {
  const app = document.getElementById("app");

  app.innerHTML = "<h2>SportLab DEBUG MODE...</h2>";

  console.log("INIT START");

  try {
    console.log("Loading DrawHunter...");
    const football = await loadDrawHunterData();
    console.log("FOOTBALL DATA:", football);

    console.log("Loading FrenchFlair...");
    const rugby = await loadFrenchFlairData();
    console.log("RUGBY DATA:", rugby);

    render(app, football, rugby);

  } catch (e) {
    console.error("CRASH:", e);

    app.innerHTML = `
      <h1>❌ ERROR</h1>
      <pre>${e.message}</pre>
    `;
  }
}

function render(app, football, rugby) {
  app.innerHTML = `
    <h1>SPORTLAB DEBUG</h1>

    <h2>FOOTBALL</h2>
    <pre>${JSON.stringify(football, null, 2)}</pre>

    <h2>RUGBY</h2>
    <pre>${JSON.stringify(rugby, null, 2)}</pre>
  `;
}

init();