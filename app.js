import { loadDrawHunterData } from "./modules/drawhunter.js";
import { loadFrenchFlairData } from "./modules/frenchflair.js";

const CACHE_KEY = "sportlab_cache_v1";

/**
 * INIT SPORTLAB
 */
async function init() {

  const app = document.getElementById("app");

  const cached = getCache();

  if (cached) {
    render(app, cached.football, cached.rugby);
  }

  try {

    const football = await loadDrawHunterData();
    const rugby = await loadFrenchFlairData();

    const data = { football, rugby };

    saveCache(data);

    render(app, football, rugby);

  } catch (error) {
    console.error("SportLab error:", error);

    app.innerHTML = `
      <h1>❌ Error loading SportLab</h1>
      <p>${error.message}</p>
    `;
  }
}

/**
 * CACHE SAVE
 */
function saveCache(data) {
  localStorage.setItem(CACHE_KEY, JSON.stringify({
    ...data,
    timestamp: Date.now()
  }));
}

/**
 * CACHE GET
 */
function getCache() {
  const raw = localStorage.getItem(CACHE_KEY);
  if (!raw) return null;

  const parsed = JSON.parse(raw);

  // cache 60 sec
  if (Date.now() - parsed.timestamp > 60000) {
    return null;
  }

  return parsed;
}

/**
 * DASHBOARD RENDER
 */
function render(app, football, rugby) {

  app.innerHTML = `
    <h1>🏟️ SportLab V1.1 AI Dashboard</h1>

    <hr/>

    <h2>⚽ DrawHunter (Football AI)</h2>
    <pre>${formatData(football)}</pre>

    <hr/>

    <h2>🏉 FrenchFlair (Rugby AI)</h2>
    <pre>${formatData(rugby)}</pre>

    <hr/>

    <p>🧠 AI Layer: ACTIVE</p>
    <p>📊 Value detection enabled</p>
    <p>⚙️ Cache: ON (60s)</p>
  `;
}

/**
 * FORMAT SAFE DISPLAY
 */
function formatData(data) {
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return "Invalid data format";
  }
}

// 🚀 START
init();