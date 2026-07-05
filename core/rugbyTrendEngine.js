export function analyzeRugbyTrend(match) {
  const homeAvg = Number(match.homeAvgPoints || 27);
  const awayAvg = Number(match.awayAvgPoints || 24);

  const totalExpected = homeAvg + awayAvg;

  let trend = "OVER";
  let confidence = 55;

  if (totalExpected < 47) {
    trend = "UNDER";
    confidence = 62;
  }

  if (totalExpected > 55) {
    trend = "OVER";
    confidence = 64;
  }

  return {
    ...match,
    expectedPoints: totalExpected,
    trend,
    confidence
  };
}