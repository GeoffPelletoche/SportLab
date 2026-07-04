import { COMPETITIONS } from "../core/competitions.js";
import { getFootballFixtures } from "../core/api.js";
import { analyzeMatch } from "../core/ai.js";

export async function loadDrawHunterData() {

  const results = {};

  for (const comp of COMPETITIONS.drawhunter) {

    if (!comp.active) continue;

    const data = await getFootballFixtures(comp.id);

    results[comp.name] = (data.response || [])
      .slice(0, 10)
      .map(match => analyzeMatch(match, "DRAW_ONLY"));
  }

  return results;
}
