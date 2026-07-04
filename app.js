import { getFootballBatch, getRugbyBatch } from "./core/api.js";

async function init() {

  const app = document.getElementById("app");

  app.innerHTML = "<h1>Loading SportLab...</h1>";

  try {

    const football = await getFootballBatch();
    const rugby = await getRugbyBatch();

    render(app, football, rugby);

  } catch (e) {
    console.error(e);
    app.innerHTML = "Error loading SportLab";
  }
}

function render(app, football, rugby) {

  app.innerHTML = `
    <h1>🏟️ SportLab CORE V1.2</h1>

    <h2>⚽ Football Batch</h2>
    <pre>${JSON.stringify(football, null, 2)}</pre>

    <h2>🏉 Rugby Batch</h2>
    <pre>${JSON.stringify(rugby, null, 2)}</pre>
  `;
}

init();