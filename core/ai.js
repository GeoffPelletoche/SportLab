import { computeValue } from "./valueEngine.js";

export function analyzeMatch(match, mode = "FOOTBALL") {

  // simulation probabilité (sera remplacé plus tard par stats API)
  const probability = Math.random();

  const odds = 2; // par défaut (sera injecté plus tard API bookmakers)

  const value = computeValue({
    probability,
    odds
  });

  return {
    match,
    mode,
    ...value
  };
}
