/**
 * SPORTLAB V3 — BETS VIEW
 */

export function renderBets(bets = []) {
  const placedBets = bets.filter(bet => bet.placed === true);

  if (!placedBets.length) {
    return `
      <h2>🎯 Paris placés</h2>
      <p class="small">Aucun pari placé pour le moment.</p>
    `;
  }

  const sorted = [...placedBets].sort(
    (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
  );

  return `
    <h2>🎯 Paris placés</h2>

    ${sorted.map(renderBet).join("")}
  `;
}

function renderBet(bet) {
  return `
    <div class="journal-item">
      <p>
        ${sportIcon(bet.sport)}
        <strong>${bet.match}</strong>
      </p>

      <p class="small">
        ${bet.market}
      </p>

      <p class="small">
        Cote : ${bet.odds}
      </p>

      <p class="small">
        Mise : ${bet.stake} €
      </p>

      <span class="badge badge-value">
        Pari placé
      </span>

      <p class="small">
        ${formatDate(bet.createdAt)}
      </p>

      <hr/>
    </div>
  `;
}

function sportIcon(sport) {
  if (sport === "rugby") return "🏉";
  if (sport === "football") return "⚽";
  return "🏟️";
}

function formatDate(timestamp) {
  if (!timestamp) return "-";
  return new Date(timestamp).toLocaleString("fr-FR");
}