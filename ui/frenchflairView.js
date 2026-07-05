/**
 * SPORTLAB V3 — FRENCHFLAIR VIEW
 * Rôle unique :
 * afficher les matchs rugby et leur tendance OVER / UNDER.
 */

export function renderFrenchFlair(matches) {
  if (!matches.length) {
    return `<p class="small">Aucun match FrenchFlair disponible.</p>`;
  }

  return `
    ${matches.map(match => `
      <div class="card">
        <h3>${match.home} vs ${match.away}</h3>
        <p class="small">${match.competition}</p>

        <p>Tendance : <strong>${match.trend}</strong></p>
        <p>Confiance : ${match.confidence}%</p>
        <p>Total attendu : ${match.expectedTotalPoints} pts</p>

        <label>
          Ligne bookmaker
          <input type="number" step="0.5" placeholder="Ex : 48.5">
        </label>

        <label>
          Cote ${match.trend}
          <input type="number" step="0.01" placeholder="Ex : 1.90">
        </label>

        <button>Analyser</button>
      </div>
    `).join("")}
  `;
}