export function computeROI(bets) {
  const total = bets.length;

  const wins = bets.filter(b => b.result === "win").length;

  const profit = bets.reduce((acc, b) => {
    if (b.result === "win") return acc + (b.stake * (b.odds - 1));
    if (b.result === "loss") return acc - b.stake;
    return acc;
  }, 0);

  const invested = bets.reduce((a, b) => a + b.stake, 0);

  return {
    total,
    wins,
    losses: total - wins,
    profit,
    roi: invested ? (profit / invested) * 100 : 0
  };
}
