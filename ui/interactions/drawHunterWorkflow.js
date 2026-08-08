import { showToast } from "./sportlabUi.js";
import { computeValue } from "../../core/engines/valueEngine.js";
import { CONFIG } from "../../core/config/config.js";
import { explainBookmakerPrice } from "../../core/engines/drawHunterExplainabilityEngine.js";

import {
  getDrawHunterContext,
  saveDrawHunterContext,
  saveDrawHunterMatchWorkflow
} from "../../core/stores/drawHunterWorkflowStore.js";

const PRIORITY = { pending: 0, new: 1, awaiting_result: 2, resulted: 3, archived: 4 };

function formatPercent(value) {
  const number = Number(value);
  return Number.isFinite(number) ? `${(number * 100).toFixed(1)}%` : "-";
}

function formatOdds(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 1 ? number.toFixed(2) : "-";
}

function getValuation(card) {
  const input = card?.querySelector("[data-dh-bookmaker-odds]");
  const odds = Number(input?.value);
  const probability = Number(card?.dataset.dhProbabilityRaw);

  if (!Number.isFinite(odds) || odds <= 1 || !Number.isFinite(probability) || probability <= 0) {
    return null;
  }

  return {
    odds,
    ...computeValue({
      probability,
      odds,
      minValue: CONFIG.drawhunter.minValue
    })
  };
}

function updateValuationDisplay(card, valuation) {
  if (!card) return;

  const oddsKpi = card.querySelector('[data-dh-kpi="odds"]');
  const valueKpi = card.querySelector('[data-dh-kpi="value"]');
  const decisionKpi = card.querySelector('[data-dh-kpi="decision"]');

  if (!valuation) {
    if (oddsKpi) {
      oddsKpi.querySelector("strong").textContent = "-";
      oddsKpi.querySelector("small").textContent = "Marché nul";
    }
    if (valueKpi) {
      valueKpi.querySelector("strong").textContent = "-";
      valueKpi.querySelector("small").textContent = "En attente de la cote";
    }
    if (decisionKpi) {
      decisionKpi.querySelector("strong").textContent = "En attente";
      decisionKpi.querySelector("small").textContent = "Saisis la cote bookmaker";
    }
    card.dataset.dhValue = "0";
    card.classList.remove("dh-match-card--value", "dh-match-card--pass");
    card.classList.add("dh-match-card--pending");

    const betContainer = card.querySelector("[data-dh-bet-container]");
    const passContainer = card.querySelector("[data-dh-pass-container]");
    if (betContainer) betContainer.hidden = true;
    if (passContainer) {
      passContainer.hidden = false;
      const strong = passContainer.querySelector("strong");
      const paragraph = passContainer.querySelector("p");
      if (strong) strong.textContent = "Analyse à compléter";
      if (paragraph) paragraph.textContent = "Saisis la cote bookmaker pour calculer la value.";
    }
    return;
  }

  const isValue = String(valuation.decision).toUpperCase().includes("VALUE");
  const decisionLabel = isValue ? "VALUE" : "Pas de pari";
  const decisionNote = isValue ? "Edge positif détecté" : "Seuil de value non atteint";

  if (oddsKpi) {
    oddsKpi.querySelector("strong").textContent = formatOdds(valuation.odds);
    oddsKpi.querySelector("small").textContent = "Marché nul";
  }
  if (valueKpi) {
    valueKpi.querySelector("strong").textContent = formatPercent(valuation.value);
    valueKpi.querySelector("small").textContent =
      Number(valuation.value) > 0 ? "Edge positif" :
      Number(valuation.value) === 0 ? "Neutre" : "Edge négatif";
  }
  if (decisionKpi) {
    decisionKpi.querySelector("strong").textContent = decisionLabel;
    decisionKpi.querySelector("small").textContent = decisionNote;
  }

  card.dataset.dhValue = String(Number(valuation.value) || 0);
  card.classList.remove("dh-match-card--pending", "dh-match-card--value", "dh-match-card--pass");
  card.classList.add(isValue ? "dh-match-card--value" : "dh-match-card--pass");

  const betContainer = card.querySelector("[data-dh-bet-container]");
  const passContainer = card.querySelector("[data-dh-pass-container]");

  if (betContainer) betContainer.hidden = !isValue;
  if (passContainer) passContainer.hidden = isValue;

  if (passContainer && !isValue) {
    const strong = passContainer.querySelector("strong");
    const paragraph = passContainer.querySelector("p");
    if (strong) strong.textContent = "Aucun pari recommandé";
    if (paragraph) paragraph.textContent = decisionNote;
  }
}

function updateBookmakerExplanation(card, valuation) {
  const factorElement = card?.querySelector('[data-dh-explain-factor="bookmaker-price"]');
  if (!factorElement) return;

  const probability = Number(card?.dataset.dhProbabilityRaw);
  const factor = explainBookmakerPrice(probability, valuation?.odds || null);
  const stars = Math.max(0, Math.min(5, Number(factor.stars) || 0));

  factorElement.className = `dh-explain-factor dh-explain-factor--${factor.tone}`;
  const starElement = factorElement.querySelector(".dh-explain-stars");
  const detailElement = factorElement.querySelector("p");

  if (starElement) {
    starElement.textContent = `${"★".repeat(stars)}${"☆".repeat(5 - stars)}`;
    starElement.setAttribute("aria-label", `Influence ${stars} sur 5`);
  }
  if (detailElement) detailElement.textContent = factor.detail;
}



function isCardBeforeKickoff(card) {
  const kickoff = Date.parse(card?.dataset?.dhDate || "");
  return Number.isFinite(kickoff) && kickoff > Date.now();
}

function updateDrawHunterCardState(card, status) {
  if (!card) return;

  card.dataset.workflowState = status;

  const statusLabel = card.querySelector("[data-dh-status-label]");
  if (statusLabel) {
    statusLabel.textContent = status === "pending"
      ? "À ANALYSER"
      : status === "awaiting_result"
        ? "EN ATTENTE"
        : String(status).toUpperCase();
  }

  const primary = card.querySelector('[data-dh-action="start"], [data-dh-action="continue"], [data-dh-action="complete"]');
  if (primary) {
    if (status === "pending") {
      primary.dataset.dhAction = "complete";
      primary.textContent = "Terminer l’analyse";
    } else if (status === "awaiting_result") {
      const canEdit =
        isCardBeforeKickoff(card) &&
        card.dataset.dhPlaced !== "true";
      primary.dataset.dhAction = canEdit ? "edit" : "history";
      primary.textContent = canEdit ? "Modifier l’analyse" : "Voir l’historique";
      primary.setAttribute("aria-expanded", "false");
    }
  }

  const timelineSteps = [...card.querySelectorAll(".dh-timeline-step")];
  if (status === "awaiting_result") {
    timelineSteps.slice(0, 3).forEach(step => step.classList.add("dh-timeline-step--complete"));
  }
}

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

  root.addEventListener("input", event => {
    const input = event.target.closest("[data-dh-bookmaker-odds]");
    if (!input) return;

    const card = input.closest("[data-dh-card]");
    const matchId = card?.dataset.matchId;
    if (!card || !matchId) return;

    const valuation = getValuation(card);
    updateValuationDisplay(card, valuation);
    updateBookmakerExplanation(card, valuation);

    saveDrawHunterMatchWorkflow(matchId, {
      bookmakerOdds: valuation?.odds || null,
      impliedProbability: valuation?.impliedProbability || 0,
      value: valuation?.value || 0,
      edge: valuation?.edge || 0,
      decision: valuation?.decision || "À ANALYSER",
      reason: valuation?.reason || "Cote bookmaker non renseignée"
    });
  });

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

    if (kind === "edit") {
      if (!isCardBeforeKickoff(card)) {
        showToast({
          title: "Analyse verrouillée",
          text: "Le match a commencé : la cote, la décision et le pari sont désormais en lecture seule.",
          tone: "warning",
          icon: "!"
        });
        return;
      }

      saveDrawHunterMatchWorkflow(matchId, {
        status: "pending",
        event: {
          type: "reopened",
          label: "Analyse rouverte",
          note: "Réévaluation autorisée avant le coup d’envoi"
        }
      });
      updateDrawHunterCardState(card, "pending");
      applyView();
      card.querySelector("[data-dh-bookmaker-odds]")?.focus();
      return;
    }

    if (kind === "complete") {
      if (!isCardBeforeKickoff(card)) {
        showToast({
          title: "Analyse verrouillée",
          text: "Le match a commencé : l’analyse ne peut plus être modifiée.",
          tone: "warning",
          icon: "!"
        });
        return;
      }

      const valuation = getValuation(card);

      if (!valuation) {
        const oddsInput = card.querySelector("[data-dh-bookmaker-odds]");
        showToast({
          title: "Cote bookmaker requise",
          text: "Saisis une cote supérieure à 1.00 pour calculer la value avant de terminer l’analyse.",
          tone: "warning",
          icon: "!"
        });
        oddsInput?.focus();
        return;
      }

      saveDrawHunterMatchWorkflow(matchId, {
        bookmakerOdds: valuation.odds,
        impliedProbability: valuation.impliedProbability,
        value: valuation.value,
        edge: valuation.edge,
        decision: valuation.decision,
        reason: valuation.reason
      });
    }

    const status = ({ start: "pending", continue: "pending", complete: "awaiting_result" })[kind];
    if (status) {
      saveDrawHunterMatchWorkflow(matchId, {
        status,
        event: {
          type: status,
          label: status === "pending"
            ? "Analyse commencée"
            : "Analyse terminée · en attente du résultat"
        }
      });

      updateDrawHunterCardState(card, status);
      applyView();

      const remainingCards = cards.filter(candidate =>
        candidate !== card &&
        !candidate.hidden &&
        ["new", "pending"].includes(String(candidate.dataset.workflowState || ""))
      );

      if (kind === "complete") {
        showToast({
          title: "Analyse enregistrée",
          text: remainingCards.length > 0
            ? `${remainingCards.length} analyse${remainingCards.length > 1 ? "s" : ""} DrawHunter restante${remainingCards.length > 1 ? "s" : ""}.`
            : "Toutes les analyses DrawHunter sont terminées.",
          tone: "success",
          icon: "✓"
        });

        const nextCard = remainingCards[0];
        if (nextCard) {
          window.setTimeout(() => {
            nextCard.scrollIntoView({ behavior: "smooth", block: "start" });
            nextCard.focus({ preventScroll: true });
          }, 80);
        }
      }
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
