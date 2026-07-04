import { analyzeMatch } from "../core/ai.js";
import { getRugbyFixtures } from "../core/api.js";

export async function loadFrenchFlairData() {

  const comps = {
    top14: "top_14",
    prod2: "pro_d2",
    superRugby: "super_rugby_pacific",
    npc: "bunnings_npc",
    championsCup: "champions_cup",
    internationalXV: "international_xv"
  };

  const results = {};

  for (const key in comps) {
    const data = await getRugbyFixtures(comps[key]);

    results[key] = (data.response || []).slice(0, 5).map(match => {
      return analyzeMatch(match);
    });
  }

  return results;
}
