/**
 * SPORTLAB V6.3.5 — NAVIGATION HAMBURGER
 */

export function renderNavigation(activePage = "home") {
  return `
    <header class="sportlab-app-header">

      <button
        type="button"
        class="sportlab-brand"
        onclick="navigateSportLab('home')"
        aria-label="Retour à l'accueil"
      >
        <span class="sportlab-brand-icon">
          🏟️
        </span>

        <span>
          SportLab
        </span>
      </button>

      <button
        type="button"
        id="sportlab-menu-toggle"
        class="sportlab-menu-toggle"
        aria-label="Ouvrir le menu"
        aria-expanded="false"
        aria-controls="sportlab-mobile-menu"
        onclick="toggleSportLabMenu()"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      <nav
        id="sportlab-mobile-menu"
        class="sportlab-mobile-menu"
        aria-label="Navigation principale"
      >
        ${renderNavigationItem({
          page: "home",
          icon: "🏠",
          label: "Accueil",
          activePage
        })}

        ${renderNavigationItem({
          page: "journal",
          icon: "📒",
          label: "Journal",
          activePage
        })}

        ${renderNavigationItem({
          page: "bets",
          icon: "🎯",
          label: "Paris",
          activePage
        })}

        ${renderNavigationItem({
          page: "portfolio",
          icon: "💼",
          label: "Portfolio",
          activePage
        })}

        ${renderNavigationItem({
          page: "diagnostics",
          icon: "🩺",
          label: "Diagnostics",
          activePage
        })}
      </nav>

      <div
        class="sportlab-menu-backdrop"
        onclick="closeSportLabMenu()"
        aria-hidden="true"
      ></div>

    </header>
  `;
}

function renderNavigationItem({
  page,
  icon,
  label,
  activePage
}) {
  const isActive =
    activePage === page;

  return `
    <button
      type="button"
      class="
        sportlab-menu-item
        ${isActive ? "nav-active" : ""}
      "
      onclick="
        closeSportLabMenu();
        navigateSportLab('${escapeAttribute(page)}');
      "
    >
      <span class="sportlab-menu-item-icon">
        ${icon}
      </span>

      <span class="sportlab-menu-item-label">
        ${escapeHtml(label)}
      </span>

      ${
        isActive
          ? `
            <span class="sportlab-menu-current">
              Actif
            </span>
          `
          : `
            <span class="sportlab-menu-arrow">
              ›
            </span>
          `
      }
    </button>
  `;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}