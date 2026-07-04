export function computeValue({ probability, odds }) {

  // 1. prob implicite bookmaker
  const impliedProb = 1 / odds;

  // 2. edge réel
  const edge = probability - impliedProb;

  // 3. EV (Expected Value)
  const EV = (probability * odds) - 1;

  // 4. decision logic V1.3
  let decision = "NO BET";

  if (edge > 0.05 && EV > 0) {
    decision = "VALUE BET";
  }

  if (edge > 0.10 && EV > 0.2) {
    decision = "STRONG VALUE BET";
  }

  return {
    probability,
    odds,
    impliedProb: Number(impliedProb.toFixed(3)),
    edge: Number(edge.toFixed(3)),
    EV: Number(EV.toFixed(3)),
    decision
  };
}
