/**
 * SPORTLAB V3 — DASHBOARD VIEW
 * Rôle :
 * Afficher les différentes pages de SportLab.
 */

export function renderDashboard({
  activePage = "home",
  navigationHtml = "",
  drawhunterHtml = "",
  frenchflairHtml = "",
  journalHtml = "",
  portfolioHtml = "",
  betsHtml = "",
  diagnosticsHtml = ""
  
}) {

  let content = "";

  switch (activePage) {

    case "journal":
      content = `
        <section class="card">
          ${journalHtml}
        </section>
      `;
      break;

    case "bets":
      content = `
    <section class="card">
      ${betsHtml}
    </section>
  `;
  break;

    case "portfolio":
      content = `
        <section class="card">
          <h2>💼 Portfolio</h2>
          ${portfolioHtml}
        </section>
      `;
      break;
      
    case "diagnostics":
  content = `
    <section class="card">
      <h2>🩺 Diagnostics</h2>
      ${diagnosticsHtml}
    </section>
  `;
  break;
      
    case "home":
    default:
      content = `
        <section class="card">
          <h2>⚽ DrawHunter</h2>
          ${drawhunterHtml}
        </section>

        <section class="card">
          <h2>🏉 FrenchFlair</h2>
          ${frenchflairHtml}
        </section>
      `;
      break;
  }

  return `
    <h1>🏟️ SportLab</h1>

    ${navigationHtml}

    ${content}
  `;
}
