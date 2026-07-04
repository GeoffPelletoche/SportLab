const BASE = "https://sportlab-api-bridge.xxx.workers.dev";

export async function getFootballBatch() {
  const res = await fetch(`${BASE}/?type=football`);
  return await res.json();
}

export async function getRugbyBatch() {
  const res = await fetch(`${BASE}/?type=rugby`);
  return await res.json();
}