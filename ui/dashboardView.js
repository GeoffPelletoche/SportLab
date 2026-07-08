/**
 * SPORTLAB V3 — DASHBOARD VIEW
 * Rôle unique :
 * afficher l'enveloppe principale de l'application.
 */

export function renderDashboard({
  navigationHtml,
  drawhunterHtml,
  frenchflairHtml,
  portfolioHtml,
  journalHtml
}) {
  return `
    <h1>🏟️ SportLab</h1>
    ${navigationHtml || ""}

    <section class="card">
      <h2>⚽ DrawHunter</h2>
      ${drawhunterHtml}
    </section>

    <section class="card">
      <h2>🏉 FrenchFlair</h2>
      ${frenchflairHtml}
    </section>

    <section class="card">
      ${journalHtml}
    </section>

    <section class="card">
      <h2>💼 Portfolio</h2>
      ${portfolioHtml}
    </section>
  `;
}
