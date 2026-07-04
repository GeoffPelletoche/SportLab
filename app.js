import { getFootballBatch, getRugbyBatch } from "./core/api.js";

const CACHE_KEY = "sportlab_batch_v1";

async function init() {

  const app = document.getElementById("app");

  const cached = getCache();

  if (cached) {
    render(app, cached.football, cached.rugby);
  }

  try {

    // 🔥 1 SEUL APPEL PAR TYPE
    const football = await getFootballBatch();
    const rugby = await getRugbyBatch();

    const data = { football, rugby };

    saveCache(data);

    render(app, football, rugby);

  } catch (e) {
    console.error(e);
    app.innerHTML = "Error loading SportLab";
  }
}

function saveCache(data) {
  localStorage.setItem(CACHE_KEY, JSON.stringify({
    ...data,
    ts: Date.now()
  }));
}

function getCache() {
  const raw = localStorage.getItem(CACHE_KEY);
  if (!raw) return null;

  const data = JSON.parse(raw);

  if (Date.now() - data.ts > 60000) return null;

  return data;
}

function render(app, football, rugby) {

  app.innerHTML = `
    <h1>🏟️ SportLab V1.2 Batch Optimized</h1>

    <h2>⚽ Football Batch</h2>
    <pre>${JSON.stringify(football, null, 2)}</pre>

    <h2>🏉 Rugby Batch</h2>
    <pre>${JSON.stringify(rugby, null, 2)}</pre>

    <p>🧠 Batch system active</p>
    <p>🚀 1 API call per sport</p>
  `;
}

init();