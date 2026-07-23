import {
  archiveDrawHunterMatch,
  getDrawHunterContext,
  saveDrawHunterContext,
  saveDrawHunterMatchWorkflow
} from "../../core/stores/drawHunterWorkflowStore.js";

const PRIORITY = { value: 0, pending: 1, new: 2, analyzed: 3, decided: 4, tracked: 5, resulted: 6, archived: 7 };

export function initDrawHunterWorkflow() {
  const root = document.querySelector('[data-module="drawhunter"]');
  if (!root || root.dataset.dhInitialized === "true") return;
  root.dataset.dhInitialized = "true";

  const context = getDrawHunterContext();
  const grid = root.querySelector("[data-dh-grid]");
  const filters = [...root.querySelectorAll("[data-dh-filter]")];
  const search = root.querySelector("[data-dh-search]");
  const clearSearch = root.querySelector("[data-dh-clear-search]");
  const sort = root.querySelector("[data-dh-sort]");
  const densityButtons = [...root.querySelectorAll("[data-dh-density]")];
  const cards = [...root.querySelectorAll("[data-dh-card]")];

  let activeFilter = context.filter || "all";
  let query = context.query || "";
  let sortMode = context.sort || "priority";
  let density = context.density || "comfortable";

  const updateDensity = value => {
    density = value === "compact" ? "compact" : "comfortable";
    root.classList.toggle("dh-density--compact", density === "compact");
    densityButtons.forEach(button => button.setAttribute("aria-pressed", String(button.dataset.dhDensity === density)));
    saveDrawHunterContext({ density });
  };

  const sortCards = () => {
    if (!grid) return;
    const collator = new Intl.Collator("fr", { sensitivity: "base" });
    cards.sort((a, b) => {
      if (sortMode === "date-asc" || sortMode === "date-desc") {
        const av = Date.parse(a.dataset.dhDate || "") || 0;
        const bv = Date.parse(b.dataset.dhDate || "") || 0;
        return sortMode === "date-asc" ? av - bv : bv - av;
      }
      if (sortMode === "probability-desc") return Number(b.dataset.dhProbability) - Number(a.dataset.dhProbability);
      if (sortMode === "value-desc") return Number(b.dataset.dhValue) - Number(a.dataset.dhValue);
      if (sortMode === "competition") return collator.compare(a.dataset.dhCompetition || "", b.dataset.dhCompetition || "");
      const stateA = String(a.dataset.workflowState || "new");
      const stateB = String(b.dataset.workflowState || "new");
      return (PRIORITY[stateA] ?? 99) - (PRIORITY[stateB] ?? 99) || (Date.parse(a.dataset.dhDate || "") || 0) - (Date.parse(b.dataset.dhDate || "") || 0);
    });
    cards.forEach(card => grid.appendChild(card));
  };

  const applyView = () => {
    const normalized = query.trim().toLocaleLowerCase("fr");
    filters.forEach(button => button.classList.toggle("is-active", button.dataset.dhFilter === activeFilter));
    cards.forEach(card => {
      const state = String(card.dataset.workflowState || "");
      const stateMatch = activeFilter === "all" || state === activeFilter;
      const textMatch = !normalized || String(card.dataset.dhSearchText || "").includes(normalized);
      card.hidden = !(stateMatch && textMatch);
    });
    sortCards();
    const visible = cards.filter(card => !card.hidden).length;
    const count = root.querySelector("[data-dh-visible-count]");
    if (count) count.textContent = String(visible);
    clearSearch?.toggleAttribute("hidden", !query);
    saveDrawHunterContext({ filter: activeFilter, query, sort: sortMode });
  };

  filters.forEach(button => button.addEventListener("click", () => { activeFilter = button.dataset.dhFilter || "all"; applyView(); }));
  search?.addEventListener("input", () => { query = search.value; applyView(); });
  clearSearch?.addEventListener("click", () => { query = ""; search.value = ""; search.focus(); applyView(); });
  sort?.addEventListener("change", () => { sortMode = sort.value; applyView(); });
  densityButtons.forEach(button => button.addEventListener("click", () => updateDensity(button.dataset.dhDensity)));

  root.addEventListener("click", event => {
    const action = event.target.closest("[data-dh-action]");
    if (!action) return;
    const card = action.closest("[data-dh-card]");
    const matchId = card?.dataset.matchId;
    if (!matchId) return;
    const kind = action.dataset.dhAction;

    if (["history", "details"].includes(kind)) {
      const panel = card.querySelector(kind === "history" ? "[data-dh-history]" : "[data-dh-details]");
      if (panel) {
        panel.hidden = !panel.hidden;
        action.setAttribute("aria-expanded", String(!panel.hidden));
        saveDrawHunterContext(kind === "history" ? { selectedMatchId: panel.hidden ? null : matchId } : { detailsMatchId: panel.hidden ? null : matchId });
      }
      return;
    }

    if (kind === "archive") {
      if (!confirm("Archiver cette rencontre dans le workflow DrawHunter ?")) return;
      archiveDrawHunterMatch(matchId);
      card.dataset.workflowState = "archived";
      card.classList.add("dh-match-card--archived");
      card.querySelector("[data-dh-status-label]").textContent = "ARCHIVÉ";
      applyView();
      return;
    }

    const status = ({ start: "pending", continue: "pending", complete: "analyzed" })[kind];
    if (status) {
      saveDrawHunterMatchWorkflow(matchId, { status, event: { type: status, label: status === "pending" ? "Analyse commencée" : "Analyse terminée" } });
      location.reload();
    }
  });

  root.addEventListener("keydown", event => {
    const card = event.target.closest("[data-dh-card]");
    if (!card || event.target.matches("input,select,button,textarea")) return;
    if (event.key === "Enter") {
      event.preventDefault();
      card.querySelector('[data-dh-action="details"]')?.click();
    }
    if (event.key === "h" || event.key === "H") {
      event.preventDefault();
      card.querySelector('[data-dh-action="history"]')?.click();
    }
  });

  if (search) search.value = query;
  if (sort) sort.value = sortMode;
  updateDensity(density);
  applyView();

  const reopen = (id, selector) => {
    if (!id) return;
    const selected = root.querySelector(`[data-match-id="${CSS.escape(String(id))}"]`);
    const panel = selected?.querySelector(selector);
    if (panel) panel.hidden = false;
  };
  reopen(context.selectedMatchId, "[data-dh-history]");
  reopen(context.detailsMatchId, "[data-dh-details]");

  requestAnimationFrame(() => {
    if (Number.isFinite(Number(context.scrollY)) && context.scrollY > 0) window.scrollTo(0, context.scrollY);
  });
  let scrollTimer = 0;
  window.addEventListener("scroll", () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => saveDrawHunterContext({ scrollY: window.scrollY }), 100);
  }, { passive: true });
}
