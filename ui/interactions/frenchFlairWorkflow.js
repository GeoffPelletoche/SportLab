import { archiveFrenchFlairMatch, getFrenchFlairContext, saveFrenchFlairContext, saveFrenchFlairMatchWorkflow } from "../../core/stores/frenchFlairWorkflowStore.js";

export function initFrenchFlairWorkflow() {
  const root = document.querySelector('[data-module="frenchflair"]');
  if (!root || root.dataset.ffInitialized === "true") return;
  root.dataset.ffInitialized = "true";
  const context = getFrenchFlairContext();
  const cards = [...root.querySelectorAll("[data-ff-card]")];
  const filters = [...root.querySelectorAll("[data-ff-filter]")];
  let activeFilter = context.filter || "all";

  const applyFilter = () => {
    filters.forEach(button => button.classList.toggle("is-active", button.dataset.ffFilter === activeFilter));
    cards.forEach(card => {
      const state = String(card.dataset.workflowState || "new");
      card.hidden = !(activeFilter === "all" || state === activeFilter);
    });
    const visible = cards.filter(card => !card.hidden).length;
    const count = root.querySelector("[data-ff-visible-count]");
    if (count) count.textContent = String(visible);
    saveFrenchFlairContext({ filter: activeFilter });
  };

  filters.forEach(button => button.addEventListener("click", () => { activeFilter = button.dataset.ffFilter || "all"; applyFilter(); }));

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
      if (!confirm("Archiver cette rencontre dans le workflow FrenchFlair ?")) return;
      archiveFrenchFlairMatch(matchId);
      card.dataset.workflowState = "archived";
      card.classList.add("ff-match-card--archived");
      const label = card.querySelector("[data-ff-status-label]");
      if (label) label.textContent = "ARCHIVÉ";
      applyFilter();
      return;
    }
    const status = ({ start:"pending", continue:"pending", complete:"analyzed" })[kind];
    if (status) {
      saveFrenchFlairMatchWorkflow(matchId, { status, event: { type:status, label:status === "pending" ? "Analyse commencée" : "Analyse terminée" } });
      location.reload();
    }
  });

  applyFilter();
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
  window.addEventListener("scroll", () => { clearTimeout(timer); timer = setTimeout(() => saveFrenchFlairContext({ scrollY: window.scrollY }), 100); }, { passive:true });
}
