import { CONFIG } from "../core/config.js";
import { getFootballFixtures } from "../core/api.js";

export async function loadDrawHunterData() {
  const leagues = CONFIG.footballLeagues;

  const data = {};

  for (const key in leagues) {
    const leagueId = leagues[key];
    data[key] = await getFootballFixtures(leagueId);
  }

  return data;
}
