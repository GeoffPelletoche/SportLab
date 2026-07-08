/**
 * SPORTLAB V3 — DASHBOARD VIEW
 * Rôle unique :
 * afficher l'enveloppe principale de l'application.
 */

export function renderDashboard({
  activePage,
  navigationHtml,
  drawhunterHtml,
  frenchflairHtml,
  portfolioHtml,
  journalHtml
}) {
  return `
    <h1>🏟️ SportLab</h1>
    ${navigationHtml || ""}

        ${activePage === "home" ? `
      <section class="card">
        <h2>⚽ DrawHunter</h2>
        ${drawhunterHtml}
      </section>

      <section class="card">
        <h2>🏉 FrenchFlair</h2>
        ${frenchflairHtml}
      </section>
    ` : ""}

    ${activePage === "journal" ? `
      <section class="card">
        ${journalHtml}
      </section>
    ` : ""}

    ${activePage === "bets" ? `
      <section class="card">
        <h2>🎯 Paris placés</h2>
        <p class="small">Cette page arrive à l’étape suivante.</p>
      </section>
    ` : ""}

    ${activePage === "portfolio" ? `
      <section class="card">
        <h2>💼 Portfolio</h2>
        ${portfolioHtml}
      </section>
    ` : ""}
}
