export function createRouter({ eventBus, routes = ["home", "journal", "bets", "portfolio", "diagnostics"] } = {}) {
  const allowed = new Set(routes);
  let current = "home";
  function navigate(route, { replace = false } = {}) {
    const next = allowed.has(route) ? route : "home";
    current = next;
    const url = new URL(window.location.href);
    url.hash = next === "home" ? "" : `#${next}`;
    history[replace ? "replaceState" : "pushState"]({ sportlabRoute: next }, "", url);
    eventBus?.emit?.("router:navigate", { route: next });
    return next;
  }
  function resolve() { const route = window.location.hash.replace(/^#/, "") || "home"; current = allowed.has(route) ? route : "home"; return current; }
  function getCurrent() { return current; }
  return Object.freeze({ navigate, resolve, getCurrent, routes: () => [...allowed] });
}
