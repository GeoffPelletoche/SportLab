import {
  archiveFrenchFlairMatch,
  getFrenchFlairContext,
  saveFrenchFlairContext,
  saveFrenchFlairMatchWorkflow,
  statusLabel
} from "../../core/stores/frenchFlairWorkflowStore.js";

let activeScrollController = null;

const STATUS_ORDER = ["new", "pending", "analyzed", "decided", "value", "tracked", "resulted", "archived"];

export function initFrenchFlairWorkflow() {
  activeScrollController?.abort();
  activeScrollController = new AbortController();

  const root = document.querySelector('[data-module="frenchflair"]');
  if (!root || root.dataset.ffInitialized === "true") return;
  root.dataset.ffInitialized = "true";

  const context = getFrenchFlairContext();
  const grid = root.querySelector("[data-ff-grid]");
  const filters = [...root.querySelectorAll("[data-ff-filter]")];
  const search = root.querySelector("[data-ff-search]");
  const sort = root.querySelector("[data-ff-sort]");
  const densityButtons = [...root.querySelectorAll("[data-ff-density]")];
  const reset = root.querySelector("[data-ff-reset]");
  const count = root.querySelector("[data-ff-visible-count]");
  const summary = root.querySelector("[data-ff-summary]");

  let state = {
    filter: context.filter || "all",
    query: context.query || "",
    sort: context.sort || "date-asc",
    density: context.density || "comfort"
  };

  if (search) search.value = state.query;
  if (sort) sort.value = state.sort;

  const cards = () => [...root.querySelectorAll("[data-ff-card]")];
  const normalize = value => String(value || "").toLocaleLowerCase("fr-FR").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

  const compareCards = (a, b) => {
    const number = (card, key, fallback = 0) => Number(card.dataset[key]) || fallback;
    switch (state.sort) {
      case "date-desc": return number(b, "date") - number(a, "date");
      case "confidence-desc": return number(b, "confidence") - number(a, "confidence");
      case "total-desc": return number(b, "total") - number(a, "total");
      case "sigma-asc": return number(a, "sigma", 999) - number(b, "sigma", 999);
      case "value-first": return (b.dataset.workflowState === "value") - (a.dataset.workflowState === "value") || number(a, "date") - number(b, "date");
      case "status": return STATUS_ORDER.indexOf(a.dataset.workflowState) - STATUS_ORDER.indexOf(b.dataset.workflowState) || number(a, "date") - number(b, "date");
      default: return number(a, "date") - number(b, "date");
    }
  };

  const apply = () => {
    const query = normalize(state.query);
    const list = cards().sort(compareCards);
    list.forEach(card => grid?.append(card));

    let visible = 0;
    list.forEach(card => {
      const matchesFilter = state.filter === "all" || card.dataset.workflowState === state.filter;
      const matchesSearch = !query || normalize(card.dataset.search).includes(query);
      card.hidden = !(matchesFilter && matchesSearch);
      if (!card.hidden) visible += 1;
    });

    filters.forEach(button => button.classList.toggle("is-active", button.dataset.ffFilter === state.filter));
    densityButtons.forEach(button => button.classList.toggle("is-active", button.dataset.ffDensity === state.density));
    root.dataset.ffDensity = state.density;
    if (count) count.textContent = String(visible);
    if (summary) summary.textContent = visible ? `${visible} rencontre(s) affichée(s) · tri ${sort?.selectedOptions?.[0]?.textContent || "actif"}` : "Aucune rencontre ne correspond à ces critères.";
    saveFrenchFlairContext(state);
  };

  filters.forEach(button => button.addEventListener("click", () => { state.filter = button.dataset.ffFilter || "all"; apply(); }));
  search?.addEventListener("input", () => { state.query = search.value; apply(); });
  sort?.addEventListener("change", () => { state.sort = sort.value; apply(); });
  densityButtons.forEach(button => button.addEventListener("click", () => { state.density = button.dataset.ffDensity || "comfort"; apply(); }));
  reset?.addEventListener("click", () => {
    state = { filter: "all", query: "", sort: "date-asc", density: "comfort" };
    if (search) search.value = "";
    if (sort) sort.value = "date-asc";
    apply();
  });

  const updateCardState = (card, nextState) => {
    card.dataset.workflowState = nextState;
    STATUS_ORDER.forEach(item => card.classList.remove(`ff-workflow-state--${item}`));
    card.classList.add(`ff-workflow-state--${nextState}`);
    card.classList.toggle("ff-match-card--archived", nextState === "archived");
    const label = card.querySelector("[data-ff-status-label]");
    if (label) label.textContent = statusLabel(nextState).toUpperCase();
    const note = card.querySelector(".ff-card-status span");
    if (note) note.textContent = ({ new:"Rencontre nouvellement importée", pending:"Analyse en cours", analyzed:"Analyse terminée", decided:"Décision enregistrée", value:"VALUE détectée", tracked:"Pari enregistré", resulted:"Résultat disponible", archived:"Rencontre archivée" })[nextState] || "Workflow mis à jour";
  };

  root.addEventListener("click", event => {
    const action = event.target.closest("[data-ff-action]");
    if (!action) return;
    const card = action.closest("[data-ff-card]");
    const matchId = card?.dataset.matchId;
    if (!matchId) return;
    const kind = action.dataset.ffAction;

    if (["history", "details"].includes(kind)) {
      const panel = card.querySelector(kind === "history" ? "[data-ff-history]" : "[data-ff-workflow-details]");
      if (panel) {
        panel.hidden = !panel.hidden;
        action.setAttribute("aria-expanded", String(!panel.hidden));
        saveFrenchFlairContext(kind === "history" ? { selectedMatchId: panel.hidden ? null : matchId } : { detailsMatchId: panel.hidden ? null : matchId });
      }
      return;
    }

    if (kind === "archive") {
      if (!window.confirm("Archiver cette rencontre dans le workflow FrenchFlair ?")) return;
      archiveFrenchFlairMatch(matchId);
      updateCardState(card, "archived");
      apply();
      return;
    }

    const nextState = ({ start:"pending", continue:"pending", complete:"analyzed" })[kind];
    if (nextState) {
      saveFrenchFlairMatchWorkflow(matchId, { status: nextState, event: { type:nextState, label:nextState === "pending" ? "Analyse commencée" : "Analyse terminée" } });
      updateCardState(card, nextState);
      apply();
    }
  });

  apply();
  const reopen = (id, selector) => {
    if (!id) return;
    const card = root.querySelector(`[data-match-id="${CSS.escape(String(id))}"]`);
    const panel = card?.querySelector(selector);
    if (panel) panel.hidden = false;
  };
  reopen(context.selectedMatchId, "[data-ff-history]");
  reopen(context.detailsMatchId, "[data-ff-workflow-details]");
  requestAnimationFrame(() => { if (Number(context.scrollY) > 0) window.scrollTo(0, Number(context.scrollY)); });

  let timer = 0;
  const onScroll = () => { clearTimeout(timer); timer = window.setTimeout(() => saveFrenchFlairContext({ scrollY: window.scrollY }), 120); };
  window.addEventListener("scroll", onScroll, { passive:true, signal: activeScrollController.signal });
}
