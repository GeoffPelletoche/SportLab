export function analyzeMatch(match, mode = "FOOTBALL") {

  const strength = Math.random() * 100;

  if (mode === "DRAW_ONLY") {
    return {
      match,
      recommendation: strength > 70 ? "DRAW VALUE" : "NO VALUE",
      confidence: strength.toFixed(1)
    };
  }

  if (mode === "RUGBY") {
    return {
      match,
      recommendation: strength > 65 ? "VALUE BET" : "NO VALUE",
      confidence: strength.toFixed(1)
    };
  }

  return {
    match,
    recommendation: "NO VALUE",
    confidence: 0
  };
}
