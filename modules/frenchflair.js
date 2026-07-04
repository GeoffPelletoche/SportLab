import { CONFIG } from "../core/config.js";
import { getRugbyFixtures } from "../core/api.js";

export async function loadFrenchFlairData() {
  const comps = CONFIG.rugbyCompetitions;

  const data = {};

  for (const key in comps) {
    data[key] = await getRugbyFixtures(comps[key]);
  }

  return data;
}
