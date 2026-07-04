import { CONFIG } from "./config.js";

async function fetchData(url) {
  const res = await fetch(url, {
    headers: {
      "x-apisports-key": CONFIG.apiKey
    }
  });

  return await res.json();
}

/**
 * FOOTBALL (DrawHunter)
 */
export async function getFootballFixtures(league) {
  return fetchData(
    `${CONFIG.baseUrl}/fixtures?league=${league}&season=2024`
  );
}

/**
 * RUGBY (FrenchFlair)
 * ⚠️ API-SPORTS rugby dépend plan dispo
 */
export async function getRugbyFixtures(competition) {
  return fetchData(
    `${CONFIG.baseUrl}/rugby/fixtures?league=${competition}`
  );
}
