/**
 * SPORTLAB V3 — DRAWHUNTER VIEW
 * Rôle unique :
 * afficher les analyses DrawHunter.
 */

export function renderDrawHunter(matches) {
  if (!matches.length) {
    return `<p class="small">Aucun match DrawHunter disponible.</p>`;
  }

  return `
    ${matches.map(match => `
      <div class="card">
        <h3>${match.home} vs ${match.away}</h3>
        <p class="small">${match.competition}</p>

        <p>Marché : <strong>DRAW</strong></p>
        <p>Cote : ${match.odds}</p>
        <p>Probabilité modèle : ${(match.probability * 100).toFixed(1)}%</p>
        <p>Value : ${(match.value * 100).toFixed(1)}%</p>

        <span class="badge ${match.decision === "VALUE BET" ? "badge-value" : "badge-no"}">
          ${match.decision}
        </span>
      </div>
    `).join("")}
  `;
}