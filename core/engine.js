export function computeValue(match) {
  // version SIMPLE V1 (pas de complexité inutile)
  const prob = Math.random() * 100;

  return {
    match,
    value: prob > 60 ? "HIGH" : "LOW",
    confidence: prob.toFixed(1)
  };
}
