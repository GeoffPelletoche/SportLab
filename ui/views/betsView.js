function formatResultBadge(bet) {
  switch (bet.result) {
    case "WON":
      return `<span class="badge badge-success">✅ Pari gagné</span>`;

    case "LOST":
      return `<span class="badge badge-danger">❌ Pari perdu</span>`;

    case "PUSH":
      return `<span class="badge badge-warning">↩️ Pari remboursé</span>`;

    case "PENDING":
      return `<span class="badge badge-info">⏳ Pari en attente</span>`;

    case "NON_PLACED":
      return `<span class="badge badge-secondary">📝 Analyse uniquement</span>`;

    default:
      return `<span class="badge badge-secondary">Inconnu</span>`;
  }
}

function renderBet(bet) {
  const stake = Number(bet.stake || 0);
  const odds = Number(bet.odds || 0);

  let profit = null;

  if (bet.result === "WON") {
    profit = stake * (odds - 1);
  }

  if (bet.result === "LOST") {
    profit = -stake;
  }

  if (bet.result === "PUSH") {
    profit = 0;
  }

  return `
    <section class="card bet-card">

      <h3>${bet.match}</h3>

      <p>
        <strong>${bet.source}</strong>
        • ${bet.sport}
      </p>

      ${
        bet.competition
          ? `<p>${bet.competition}</p>`
          : ""
      }

      <hr>

      <p>
        <strong>Marché :</strong>
        ${bet.market}
      </p>

      ${
        bet.line !== null && bet.line !== undefined
          ? `
            <p>
              <strong>Ligne :</strong>
              ${bet.line}
            </p>
          `
          : ""
      }

      <p>
        <strong>Cote :</strong>
        ${odds.toFixed(2)}
      </p>

      <p>
        <strong>Mise :</strong>
        ${stake.toFixed(2)} €
      </p>

      ${formatResultBadge(bet)}

      ${
        bet.result !== "PENDING" &&
        bet.result !== "NON_PLACED"
          ? `
            <hr>

            <p>
              <strong>Score final :</strong>
              ${bet.finalHomePoints ?? "-"}
              -
              ${bet.finalAwayPoints ?? "-"}
            </p>

            <p>
              <strong>Total :</strong>
              ${bet.finalTotalPoints ?? "-"}
            </p>

            <p>
              <strong>Statut :</strong>
              ${bet.finalStatus ?? "-"}
            </p>

            <p>
              <strong>Profit :</strong>
              ${
                profit >= 0
                  ? "+"
                  : ""
              }${profit.toFixed(2)} €
            </p>
          `
          : ""
      }

    </section>
  `;
}

export function renderBets(bets = []) {
  const placedBets = bets.filter(
    bet => bet.placed === true
  );

  if (!placedBets.length) {
    return `
      <h2>🎯 Paris placés</h2>

      <p class="small">
        Aucun pari placé pour le moment.
      </p>
    `;
  }

  const sorted = [...placedBets].sort(
    (a, b) =>
      (b.createdAt || 0) -
      (a.createdAt || 0)
  );

  return `
    <h2>🎯 Paris placés</h2>

    <pre id="settlement-debug"></pre>

    ${sorted.map(renderBet).join("")}
  `;
}
