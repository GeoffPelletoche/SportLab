import { loadNflMatches } from "../modules/nfl.js";
export async function getNflPayload(options = {}) {
  try { const payload = await loadNflMatches(options); return normalize(payload); }
  catch (error) { console.error("[NFLService] Échec du chargement :", error); return { matches: [], meta: { sport: "nfl", loading: false, error: true, errorMessage: error?.message || String(error) } }; }
}
function normalize(payload) { const matches=Array.isArray(payload?.matches)?payload.matches:[]; return { matches, meta:{...(payload?.meta||{}), visibleTotal:matches.length, hiddenTotal:0} }; }
