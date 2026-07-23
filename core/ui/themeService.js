const THEMES = new Set(["premium", "dark", "light"]);
const DENSITIES = new Set(["comfortable", "compact"]);

export function createThemeService({ settingsStore, eventBus }) {
  function apply(settings = settingsStore.getState()) {
    const theme = THEMES.has(settings.theme) ? settings.theme : "premium";
    const density = DENSITIES.has(settings.density) ? settings.density : "comfortable";
    document.documentElement.dataset.slTheme = theme;
    document.documentElement.dataset.slDensity = density;
    document.documentElement.style.colorScheme = theme === "light" ? "light" : "dark";
    eventBus?.emit?.("theme:applied", { theme, density });
    return { theme, density };
  }
  function setTheme(theme) { return apply(settingsStore.update({ theme })); }
  function setDensity(density) { return apply(settingsStore.update({ density })); }
  return Object.freeze({ apply, setTheme, setDensity });
}
