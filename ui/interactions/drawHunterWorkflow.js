import {
  archiveDrawHunterMatch,
  getDrawHunterContext,
  saveDrawHunterContext,
  saveDrawHunterMatchWorkflow
} from "../../core/stores/drawHunterWorkflowStore.js";

export function initDrawHunterWorkflow() {
  const root = document.querySelector('[data-module="drawhunter"]');
  if (!root) return;

  const context = getDrawHunterContext();
  const filters = [...root.querySelectorAll("[data-dh-filter]")];
  const cards = [...root.querySelectorAll("[data-dh-card]")];

  const applyFilter = filter => {
    const selected = filter || "all";
    filters.forEach(button => button.classList.toggle("is-active", button.dataset.dhFilter === selected));
    cards.forEach(card => {
      const states = String(card.dataset.workflowState || "").split(" ");
      card.hidden = selected !== "all" && !states.includes(selected);
    });
    const visible = cards.filter(card => !card.hidden).length;
    const count = root.querySelector("[data-dh-visible-count]");
    if (count) count.textContent = String(visible);
    saveDrawHunterContext({ filter: selected });
  };

  filters.forEach(button => button.addEventListener("click", () => applyFilter(button.dataset.dhFilter)));
  applyFilter(context.filter || "all");

  root.addEventListener("click", event => {
    const action = event.target.closest("[data-dh-action]");
    if (!action) return;
    const card = action.closest("[data-dh-card]");
    const matchId = card?.dataset.matchId;
    if (!matchId) return;

    const kind = action.dataset.dhAction;
    if (kind === "history") {
      const panel = card.querySelector("[data-dh-history]");
      if (panel) {
        panel.hidden = !panel.hidden;
        action.setAttribute("aria-expanded", String(!panel.hidden));
        saveDrawHunterContext({ selectedMatchId: panel.hidden ? null : matchId });
      }
      return;
    }

    if (kind === "archive") {
      if (!confirm("Archiver cette rencontre dans le workflow DrawHunter ?")) return;
      archiveDrawHunterMatch(matchId);
      card.dataset.workflowState = "archived";
      card.classList.add("dh-match-card--archived");
      card.querySelector("[data-dh-status-label]").textContent = "ARCHIVÉ";
      applyFilter(getDrawHunterContext().filter);
      return;
    }

    const status = ({ start: "pending", continue: "pending", complete: "analyzed" })[kind];
    if (status) {
      saveDrawHunterMatchWorkflow(matchId, {
        status,
        event: { type: status, label: status === "pending" ? "Analyse commencée" : "Analyse terminée" }
      });
      location.reload();
    }
  });

  if (context.selectedMatchId) {
    const selected = root.querySelector(`[data-match-id="${CSS.escape(String(context.selectedMatchId))}"]`);
    const panel = selected?.querySelector("[data-dh-history]");
    if (panel) panel.hidden = false;
  }

  requestAnimationFrame(() => {
    if (Number.isFinite(Number(context.scrollY)) && context.scrollY > 0) window.scrollTo(0, context.scrollY);
  });
  window.addEventListener("scroll", () => saveDrawHunterContext({ scrollY: window.scrollY }), { passive: true });
}
