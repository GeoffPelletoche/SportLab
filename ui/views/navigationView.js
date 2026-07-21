/**
 * SPORTLAB V3 — NAVIGATION VIEW
 */

export function renderNavigation(active = "home") {
  return `
    <nav class="sportlab-nav">
      ${navButton("home", "🏠 Accueil", active)}
      ${navButton("journal", "📒 Journal", active)}
      ${navButton("bets", "🎯 Paris", active)}
      ${navButton("portfolio", "💼 Portfolio", active)}
      ${navButton("diagnostics", "🩺 Diagnostics", active)}
    </nav>
  `;
}

function navButton(page, label, active) {
  return `
    <button
      class="${active === page ? "nav-active" : ""}"
      onclick="navigateSportLab('${page}')"
    >
      ${label}
    </button>
  `;
}
