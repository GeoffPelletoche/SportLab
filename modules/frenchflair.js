import { COMPETITIONS } from "../core/competitions.js";
import { getRugbyFixtures } from "../core/api.js";
import { analyzeMatch } from "../core/ai.js";

export async function loadFrenchFlairData() {

  const results = {};

  for (const comp of COMPETITIONS.frenchflair) {

    if (!comp.active) continue;

    const data = await getRugbyFixtures(comp.id);

    results[comp.name] = (data.response || [])
      .slice(0, 10)
      .map(match => analyzeMatch(match, "RUGBY"));
  }

  return results;
}
