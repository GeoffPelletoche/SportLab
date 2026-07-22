/**
 * SPORTLAB V6.3.7 — PACK 4
 * Interactions du Dashboard Premium V2.
 *
 * Initialisation idempotente avec délégation d’événements.
 */

let dashboardUiReady = false;

export function initDashboardPremium() {
  if (dashboardUiReady) {
    return;
  }

  dashboardUiReady = true;

  document.addEventListener("click", handleDashboardClick);
}

function handleDashboardClick(event) {
  const navigationButton = event.target.closest("[data-dashboard-nav]");

  if (navigationButton) {
    const page = navigationButton.dataset.dashboardNav;

    if (page && typeof window.navigateSportLab === "function") {
      window.navigateSportLab(page);
    }

    return;
  }

  const refreshButton = event.target.closest("[data-dashboard-refresh]");

  if (!refreshButton) {
    return;
  }

  refreshButton.disabled = true;
  refreshButton.setAttribute("aria-busy", "true");
  refreshButton.classList.add("is-refreshing");

  if (typeof window.refreshSportLab === "function") {
    window.refreshSportLab();
    return;
  }

  if (typeof window.navigateSportLab === "function") {
    window.navigateSportLab("home");
  }
}
