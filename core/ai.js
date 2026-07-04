export function analyzeMatch(match) {

  // base stats (simplifiées V1.1)
  const homeStrength = Math.random() * 100;
  const awayStrength = Math.random() * 100;

  const diff = homeStrength - awayStrength;

  let recommendation = "NO BET";
  let confidence = 0;

  if (Math.abs(diff) > 20) {
    recommendation = diff > 0 ? "HOME WIN VALUE" : "AWAY WIN VALUE";
    confidence = Math.min(95, Math.abs(diff));
  }

  if (Math.abs(diff) < 10) {
    recommendation = "DRAW / LOW VALUE";
    confidence = 30;
  }

  return {
    match,
    recommendation,
    confidence: confidence.toFixed(1)
  };
}
