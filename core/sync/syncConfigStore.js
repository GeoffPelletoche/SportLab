const CONFIG_KEY = "sportlab.v7.cloud.config";
const DEFAULT_ENDPOINT = "https://sportlab-api-bridge.geoffrey-pelletier.workers.dev";

function read() {
  try { return { ...defaults(), ...(JSON.parse(localStorage.getItem(CONFIG_KEY)) || {}) }; }
  catch { return defaults(); }
}
function defaults() {
  return { endpoint: DEFAULT_ENDPOINT, token: "", deviceId: "", cursor: 0, enabled: false, lastSyncAt: 0, lastError: "", initialMigrationDone: false };
}
function write(patch) {
  const next = { ...read(), ...patch };
  localStorage.setItem(CONFIG_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("sportlab:cloud-config", { detail: next }));
  return next;
}
export const syncConfigStore = Object.freeze({ get: read, set: write, reset: () => { localStorage.removeItem(CONFIG_KEY); return defaults(); }, key: CONFIG_KEY });
