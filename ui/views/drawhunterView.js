import {
  deriveDrawHunterWorkflowState,
  getDrawHunterMatchWorkflow,
  statusLabel
} from "../../core/stores/drawHunterWorkflowStore.js";

/**
 * SPORTLAB V6.4.1 — SPRINT 5.2
 * DrawHunter Premium V2 — workflow interactif.
 *
 * Workflow UI persistant :
 * - aucune modification du moteur DrawHunter ;
 * - aucune modification des probabilités ou de la décision ;
 * - aucune modification du store ou du settlement engine.
 */

export function renderDrawHunter(payload) {
  const matches = Array.isArray(payload?.matches) ? payload.matches : [];
  const meta = payload?.meta && typeof payload.meta === "object"
    ? payload.meta
    : null;

  const stats = buildStats(matches, meta);

  return `
    <section
      class="drawhunter-premium sl-page"
      data-module="drawhunter"
      aria-labelledby="drawhunter-title"
    >
      ${renderHero(stats, meta)}
      ${renderWorkflow(stats)}
      ${renderWorkspace(matches, meta, stats)}
    </section>
  `;
}

function renderHero(stats, meta) {
  const syncStatus = meta?.error
    ? "Synchronisation indisponible"
    : meta?.syncedAt
      ? `Synchronisé ${formatRelativeDate(meta.syncedAt)}`
      : "Données disponibles";

  return `
    <header class="dh-hero sl-panel">
      <div class="dh-hero__content">
        <div class="dh-hero__eyebrow">
          <span class="dh-hero__icon" aria-hidden="true">⚽</span>
          <span>Atelier d’analyse</span>
        </div>

        <h1 id="drawhunter-title">DrawHunter Premium</h1>

        <p class="dh-hero__lead">
          Analyse des matchs nuls, avec Double Chance uniquement lorsqu’elle est pertinente.
        </p>

        <div class="dh-hero__meta">
          <span>${safe(syncStatus)}</span>
          ${meta?.from || meta?.to ? `
            <span aria-hidden="true">•</span>
            <span>${safe(meta?.from || "-")} → ${safe(meta?.to || "-")}</span>
          ` : ""}
        </div>
      </div>

      <div class="dh-hero__scoreboard" aria-label="Synthèse DrawHunter">
        ${renderHeroMetric("Matchs", stats.total, "Rencontres visibles")}
        ${renderHeroMetric("À traiter", stats.pending, "Action requise")}
        ${renderHeroMetric("VALUE", stats.value, "Opportunités détectées", "positive")}
        ${renderHeroMetric("Progression", `${stats.progress}%`, "Analyses qualifiées")}
      </div>
    </header>
  `;
}

function renderHeroMetric(label, value, note, tone = "") {
  return `
    <article class="dh-hero-metric ${tone ? `dh-hero-metric--${tone}` : ""}">
      <span>${label}</span>
      <strong>${safe(value)}</strong>
      <small>${note}</small>
    </article>
  `;
}

function renderWorkflow(stats) {
  const steps = [
    {
      label: "Nouveau",
      note: "Match importé",
      count: stats.total,
      state: stats.total > 0 ? "active" : "idle"
    },
    {
      label: "Analyse",
      note: "Modèle disponible",
      count: stats.analyzed,
      state: stats.analyzed > 0 ? "active" : "idle"
    },
    {
      label: "Décision",
      note: "VALUE ou passage",
      count: stats.decided,
      state: stats.decided > 0 ? "active" : "idle"
    },
    {
      label: "Suivi",
      note: "Pari et résultat",
      count: stats.tracked,
      state: stats.tracked > 0 ? "active" : "idle"
    }
  ];

  return `
    <section class="dh-pipeline sl-panel" aria-labelledby="dh-pipeline-title">
      <div class="dh-section-heading">
        <div>
          <p class="dh-section-eyebrow">Progression</p>
          <h2 id="dh-pipeline-title">Pipeline d’analyse</h2>
        </div>
        <span class="dh-section-badge">${stats.progress}% terminé</span>
      </div>

      <div class="dh-pipeline__track" role="list">
        ${steps.map((step, index) => `
          <article
            class="dh-pipeline-step dh-pipeline-step--${step.state}"
            role="listitem"
          >
            <span class="dh-pipeline-step__index">${index + 1}</span>
            <div>
              <strong>${step.label}</strong>
              <small>${step.note}</small>
            </div>
            <span class="dh-pipeline-step__count">${step.count}</span>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function renderWorkspace(matches, meta, stats) {
  return `
    <section class="dh-workspace" aria-labelledby="dh-workspace-title">
      <div class="dh-workspace__main">
        <div class="dh-section-heading dh-section-heading--workspace">
          <div>
            <p class="dh-section-eyebrow">Rencontres</p>
            <h2 id="dh-workspace-title">Matchs à examiner</h2>
          </div>

          <div class="dh-workspace__summary" aria-label="Résumé des cartes">
            <span>${stats.total} visible${stats.total > 1 ? "s" : ""}</span>
            ${stats.hidden > 0 ? `<span>${stats.hidden} déjà traité${stats.hidden > 1 ? "s" : ""}</span>` : ""}
          </div>
        </div>

        ${matches.length === 0
          ? renderEmpty(meta)
          : `
            ${renderFilters(matches)}
            <div class="dh-match-grid">${matches.map(renderMatchCard).join("")}</div>
          `
        }
      </div>

      ${renderSidebar(stats, meta)}
    </section>
  `;
}

function renderFilters(matches) {
  const counts = matches.reduce((acc, match) => {
    const workflow = getDrawHunterMatchWorkflow(match?.id);
    const state = deriveDrawHunterWorkflowState(match, workflow);
    acc.all += 1;
    acc[state] = (acc[state] || 0) + 1;
    if (state === "value") acc.value += 0;
    return acc;
  }, { all: 0, new: 0, pending: 0, analyzed: 0, value: 0, tracked: 0, resulted: 0, archived: 0 });

  const filters = [
    ["all", "Tous", counts.all],
    ["new", "Nouveaux", counts.new],
    ["pending", "À analyser", counts.pending],
    ["value", "VALUE", counts.value],
    ["tracked", "Paris", counts.tracked],
    ["resulted", "Résultats", counts.resulted],
    ["archived", "Archives", counts.archived]
  ];

  return `
    <nav class="dh-filterbar sl-panel" aria-label="Filtres DrawHunter">
      <div class="dh-filterbar__buttons">
        ${filters.map(([key, label, count]) => `
          <button type="button" class="dh-filter" data-dh-filter="${key}">
            <span>${label}</span><strong>${count}</strong>
          </button>
        `).join("")}
      </div>
      <span class="dh-filterbar__visible"><strong data-dh-visible-count>${counts.all}</strong> affiché(s)</span>
    </nav>
  `;
}

function renderSidebar(stats, meta) {
  return `
    <aside class="dh-sidebar" aria-label="Repères DrawHunter">
      <section class="dh-side-card sl-panel">
        <p class="dh-section-eyebrow">Lecture rapide</p>
        <h3>Priorité du jour</h3>

        <div class="dh-priority">
          <span class="dh-priority__icon" aria-hidden="true">
            ${stats.value > 0 ? "💎" : stats.pending > 0 ? "🟡" : "✅"}
          </span>
          <div>
            <strong>
              ${stats.value > 0
                ? `${stats.value} opportunité${stats.value > 1 ? "s" : ""} VALUE`
                : stats.pending > 0
                  ? `${stats.pending} analyse${stats.pending > 1 ? "s" : ""} à poursuivre`
                  : "Aucune action urgente"
              }
            </strong>
            <p>
              ${stats.value > 0
                ? "Commence par les cartes mises en évidence."
                : stats.pending > 0
                  ? "Complète les rencontres qui nécessitent encore une décision."
                  : "Le tableau de travail est à jour."
              }
            </p>
          </div>
        </div>
      </section>

      <section class="dh-side-card sl-panel">
        <p class="dh-section-eyebrow">Cadre d’analyse</p>
        <h3>Marché principal</h3>

        <dl class="dh-definition-list">
          <div>
            <dt>Cœur du moteur</dt>
            <dd>Match nul</dd>
          </div>
          <div>
            <dt>Marché dérivé</dt>
            <dd>Double Chance si pertinente</dd>
          </div>
          <div>
            <dt>Compétitions</dt>
            <dd>${safe(meta?.competitions || "Selon synchronisation")}</dd>
          </div>
        </dl>
      </section>
    </aside>
  `;
}

function renderEmpty(meta) {
  return `
    <section class="dh-empty sl-panel">
      <div class="dh-empty__icon" aria-hidden="true">⚽</div>
      <div>
        <h3>Aucun match à examiner</h3>
        <p>
          Aucune rencontre DrawHunter n’est visible pour la période sélectionnée.
        </p>
      </div>

      ${meta?.syncLog?.length ? `
        <details class="dh-sync-details">
          <summary>Voir le détail de la synchronisation</summary>
          <div class="dh-sync-list">
            ${meta.syncLog.map(item => `
              <article>
                <strong>${safe(item.competition)}</strong>
                <span>${safe(item.status)} · ${safe(item.count)} match(s)</span>
                ${item.message ? `<small>${safe(item.message)}</small>` : ""}
              </article>
            `).join("")}
          </div>
        </details>
      ` : ""}
    </section>
  `;
}

function renderMatchCard(match, index) {
  const storedWorkflow = getDrawHunterMatchWorkflow(match?.id);
  const workflowState = deriveDrawHunterWorkflowState(match, storedWorkflow);
  const state = getMatchState(match, workflowState);
  const probability = toPercent(match?.probability);
  const value = toPercent(match?.value);
  const confidence = getConfidence(match);
  const matchId = safeDomId(match?.id ?? index);

  return `
    <article
      class="dh-match-card dh-match-card--${state.tone} sl-card"
      data-match-index="${index}"
      data-match-id="${safe(match?.id ?? index)}"
      data-dh-card
      data-workflow-state="${workflowState}"
    >
      <header class="dh-match-card__header">
        <div>
          <p class="dh-match-card__competition">
            ${safe(match?.competition || "Compétition")}
          </p>
          <time datetime="${safe(match?.date || "")}">
            ${formatDate(match?.date)}
          </time>
        </div>

        <span class="dh-status dh-status--${state.tone}" data-dh-status-label>
          ${safe(statusLabel(workflowState)).toUpperCase()}
        </span>
      </header>

      <div class="dh-matchup">
        <div class="dh-team">
          <span>Domicile</span>
          <strong>${safe(match?.home || "Équipe domicile")}</strong>
        </div>

        <div class="dh-matchup__center">
          <span>VS</span>
          <small>Match nul</small>
        </div>

        <div class="dh-team dh-team--away">
          <span>Extérieur</span>
          <strong>${safe(match?.away || "Équipe extérieure")}</strong>
        </div>
      </div>

      <section class="dh-model-focus" aria-label="Probabilité du match nul">
        <div class="dh-model-focus__value">
          <span>Probabilité modèle</span>
          <strong>${probability}%</strong>
          <small>Estimation SportLab</small>
        </div>

        <div class="dh-confidence">
          <div class="dh-confidence__heading">
            <span>Confiance visuelle</span>
            <strong>${confidence}%</strong>
          </div>
          <div
            class="dh-confidence__track"
            role="progressbar"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow="${confidence}"
          >
            <span style="width:${confidence}%"></span>
          </div>
        </div>
      </section>

      <div class="dh-card-kpis">
        ${renderCardKpi("Cote saisie", formatOdds(match?.odds), "Marché nul")}
        ${renderCardKpi("Value", `${value}%`, valueTone(match?.value))}
        ${renderCardKpi("Décision", state.shortLabel, state.note)}
      </div>

      <div class="dh-card-timeline" aria-label="Étapes du match">
        ${renderTimelineStep("Importé", true)}
        ${renderTimelineStep("Analysé", ["analyzed","decided","value","tracked","resulted","archived"].includes(workflowState))}
        ${renderTimelineStep("Décidé", ["decided","value","tracked","resulted","archived"].includes(workflowState))}
        ${renderTimelineStep("Suivi", ["tracked","resulted","archived"].includes(workflowState))}
      </div>

      ${renderHistory(storedWorkflow, match)}

      <footer class="dh-match-card__footer">
        ${renderContextActions(workflowState)}
        ${state.isValue
          ? renderBetForm(index, matchId)
          : renderNoBet(state)
        }
      </footer>
    </article>
  `;
}

function renderContextActions(workflowState) {
  const primary = workflowState === "new"
    ? ["start", "Commencer"]
    : workflowState === "pending"
      ? ["complete", "Terminer l’analyse"]
      : ["history", "Voir l’historique"];

  return `
    <div class="dh-context-actions">
      <button type="button" class="sl-button sl-button-secondary" data-dh-action="${primary[0]}">
        ${primary[1]}
      </button>
      ${primary[0] !== "history" ? `<button type="button" class="sl-button sl-button-ghost" data-dh-action="history" aria-expanded="false">Historique</button>` : ""}
      ${workflowState !== "archived" ? `<button type="button" class="sl-button sl-button-ghost" data-dh-action="archive">Archiver</button>` : ""}
    </div>
  `;
}

function renderHistory(workflow, match) {
  const baseEvent = {
    label: "Match importé",
    note: `${match?.competition || "Compétition"} · ${formatDate(match?.date)}`,
    at: workflow?.createdAt || Date.now()
  };
  const events = [baseEvent, ...(Array.isArray(workflow?.history) ? workflow.history : [])];

  return `
    <section class="dh-history" data-dh-history hidden>
      <div class="dh-history__heading">
        <strong>Journal de la rencontre</strong>
        <small>${events.length} événement(s)</small>
      </div>
      <ol>
        ${events.slice().reverse().map(event => `
          <li>
            <i aria-hidden="true"></i>
            <div><strong>${safe(event.label)}</strong>${event.note ? `<p>${safe(event.note)}</p>` : ""}</div>
            <time>${formatRelativeDate(event.at)}</time>
          </li>
        `).join("")}
      </ol>
    </section>
  `;
}

function renderCardKpi(label, value, note) {
  return `
    <div class="dh-card-kpi">
      <span>${label}</span>
      <strong>${safe(value)}</strong>
      <small>${safe(note)}</small>
    </div>
  `;
}

function renderTimelineStep(label, complete) {
  return `
    <span class="dh-timeline-step ${complete ? "dh-timeline-step--complete" : ""}">
      <i aria-hidden="true"></i>
      ${label}
    </span>
  `;
}

function renderBetForm(index, matchId) {
  return `
    <div class="dh-bet-panel">
      <label class="dh-check" for="draw-placed-${matchId}">
        <input type="checkbox" id="draw-placed-${matchId}">
        <span>
          <strong>Pari placé</strong>
          <small>Confirmer le suivi de cette décision.</small>
        </span>
      </label>

      <label class="dh-stake-field" for="draw-stake-${matchId}">
        <span>Montant misé</span>
        <div>
          <input
            id="draw-stake-${matchId}"
            type="number"
            min="0"
            step="0.01"
            inputmode="decimal"
            placeholder="Ex : 10"
          >
          <span>€</span>
        </div>
      </label>

      <button
        type="button"
        class="sl-button sl-button-primary dh-save-button"
        onclick="saveDrawHunterBet(${index})"
      >
        Enregistrer
        <span aria-hidden="true">→</span>
      </button>
    </div>
  `;
}

function renderNoBet(state) {
  return `
    <div class="dh-pass-panel">
      <span class="dh-pass-panel__icon" aria-hidden="true">✓</span>
      <div>
        <strong>${state.isPending ? "Analyse à compléter" : "Aucun pari recommandé"}</strong>
        <p>${state.note}</p>
      </div>
    </div>
  `;
}

function buildStats(matches, meta) {
  const total = matches.length;
  const analyzed = matches.filter(hasAnalysis).length;
  const decided = matches.filter(hasDecision).length;
  const value = matches.filter(match => getMatchState(match).isValue).length;
  const pending = matches.filter(match => getMatchState(match).isPending).length;
  const tracked = 0;
  const progress = total > 0
    ? Math.round((decided / total) * 100)
    : 0;

  return {
    total,
    analyzed,
    decided,
    value,
    pending,
    tracked,
    progress,
    hidden: toFiniteNumber(meta?.hiddenTotal, 0)
  };
}

function getMatchState(match, workflowState = null) {
  const decision = String(match?.decision || "").trim().toUpperCase();
  if (workflowState === "archived") {
    return { label: "ARCHIVÉ", shortLabel: "Archivé", note: "Rencontre classée", tone: "archived", isValue: false, isPending: false };
  }
  const isValue = decision.includes("VALUE");
  const isPending = !decision || decision.includes("ANALYS");

  if (isValue) {
    return {
      label: "VALUE",
      shortLabel: "VALUE",
      note: "Edge positif détecté",
      tone: "value",
      isValue: true,
      isPending: false
    };
  }

  if (isPending) {
    return {
      label: "À ANALYSER",
      shortLabel: "En attente",
      note: "Décision non finalisée",
      tone: "pending",
      isValue: false,
      isPending: true
    };
  }

  return {
    label: "PASSAGE",
    shortLabel: "Pas de pari",
    note: "Seuil de value non atteint",
    tone: "pass",
    isValue: false,
    isPending: false
  };
}

function hasAnalysis(match) {
  return Number.isFinite(Number(match?.probability));
}

function hasDecision(match) {
  const decision = String(match?.decision || "").trim();
  return decision.length > 0 && !decision.toUpperCase().includes("ANALYS");
}

function getConfidence(match) {
  const explicit = Number(match?.confidence);
  if (Number.isFinite(explicit)) {
    return clamp(explicit <= 1 ? explicit * 100 : explicit, 0, 100);
  }

  const probability = Number(match?.probability);
  if (!Number.isFinite(probability)) return 0;

  /*
   * Indicateur visuel uniquement.
   * Il ne participe à aucune décision métier.
   */
  return Math.round(clamp(probability * 100, 0, 100));
}

function toPercent(value) {
  const number = Number(value);
  return Number.isFinite(number) ? (number * 100).toFixed(1) : "0.0";
}

function formatOdds(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number.toFixed(2) : "-";
}

function valueTone(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "Indisponible";
  if (number > 0) return "Edge positif";
  if (number === 0) return "Neutre";
  return "Edge négatif";
}

function formatDate(value) {
  if (!value) return "Date non disponible";

  try {
    return new Date(value).toLocaleString("fr-FR", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return safe(value);
  }
}

function formatRelativeDate(value) {
  if (!value) return "";

  try {
    return new Date(value).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return safe(value);
  }
}

function safeDomId(value) {
  return String(value ?? "match")
    .replace(/[^a-zA-Z0-9_-]/g, "-");
}

function clamp(value, min, max) {
  return Math.min(Math.max(Number(value) || 0, min), max);
}

function toFiniteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function safe(value) {
  return String(value ?? "-")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
