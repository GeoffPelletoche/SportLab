import {
  deriveFrenchFlairWorkflowState,
  getFrenchFlairMatchWorkflow,
  statusLabel
} from "../../core/stores/frenchFlairWorkflowStore.js";

/**
 * SPORTLAB V6.5.2 — FRENCHFLAIR PREMIUM UX
 * Sprint 6.3 — Hiérarchie mobile et cockpit décisionnel
 *
 * Refonte exclusivement visuelle : les moteurs, calculs, identifiants et
 * fonctions globales de FrenchFlair restent inchangés.
 */

export function renderFrenchFlair(payload) {
  const matches = sortByDate(payload?.matches || []);
  const meta = payload?.meta || {};
  const stats = computePageStats(matches, meta);

  return `
    <section class="ff-premium sl-page" data-module="frenchflair">
      ${renderHero(stats, meta)}
      ${renderKpiRail(stats)}
      ${renderMainLayout(matches, stats, meta)}
    </section>
  `;
}

function renderHero(stats, meta) {
  const signal = dominantTrend(stats);
  const signalClass = stats.over > stats.under ? "over" : stats.under > stats.over ? "under" : "pending";
  return `
    <header class="ff-hero ff-hero--compact sl-panel">
      <div class="ff-hero__ambient" aria-hidden="true"></div>
      <div class="ff-hero__compact-row">
        <div class="ff-hero__identity">
          <span class="ff-eyebrow">🏉 FRENCHFLAIR · RUGBY TOTALS</span>
          <h1>Over / Under</h1>
          <p>Décider vite à partir du total modèle, du sigma et de la VALUE.</p>
        </div>
        <div class="ff-hero__session">
          <span>${formatPeriod(meta)}</span>
          <strong>${stats.total} rencontre${stats.total > 1 ? "s" : ""}</strong>
          <small>${meta?.error ? "Synchronisation limitée" : `Synchronisé ${relativeSync(meta?.syncedAt)}`}</small>
        </div>
      </div>
      <div class="ff-decision-strip ff-decision-strip--${signalClass}">
        <div>
          <small>SIGNAL DU JOUR</small>
          <strong>${signal}</strong>
          <span>${dominantTrendNote(stats)}</span>
        </div>
        <a class="sl-button sl-button-primary ff-primary-action" href="#ff-match-list">Voir les rencontres <span aria-hidden="true">↓</span></a>
      </div>
    </header>
  `;
}

function renderKpiRail(stats) {
  return `
    <section class="ff-kpi-rail ff-kpi-rail--compact" aria-label="Indicateurs FrenchFlair">
      ${renderHeroKpi("À analyser", stats.available, `${stats.coverage}% couverts`, "model")}
      ${renderHeroKpi("Projection", `${formatNumber(stats.avgTotal)} pts`, "moyenne", "total")}
      ${renderHeroKpi("Sigma", `${formatNumber(stats.avgSigma)} pts`, "moyen", "sigma")}
      ${renderHeroKpi("Confiance", `${stats.avgConfidence}%`, confidenceLabel(stats.avgConfidence), "confidence")}
      ${renderHeroKpi("VALUE", stats.workflow.value, `${stats.workflow.tracked} pari(s) suivi(s)`, "value")}
      ${renderHeroKpi("À décider", stats.workflow.pending + stats.workflow.analyzed, `${stats.workflow.resulted} résultat(s)`, "decision")}
    </section>
  `;
}

function renderHeroKpi(label, value, note, type) {
  return `
    <article class="ff-kpi ff-kpi--${type}">
      <span>${label}</span>
      <strong>${value}</strong>
      <small>${note}</small>
    </article>
  `;
}

function renderMainLayout(matches, stats, meta) {
  return `
    <main class="ff-workspace" id="ff-match-list">
      <div class="ff-workspace__header ff-workspace__header--decision">
        <div>
          <span class="ff-section-label">TABLEAU DE DÉCISION</span>
          <h2>Rencontres à examiner</h2>
          <p>${stats.available} modèle${stats.available > 1 ? "s" : ""} exploitable${stats.available > 1 ? "s" : ""} sur ${stats.total} rencontre${stats.total > 1 ? "s" : ""}.</p>
        </div>
        <div class="ff-legend" aria-label="Légende">
          <span><i class="is-over"></i> OVER</span>
          <span><i class="is-under"></i> UNDER</span>
          <span><i class="is-pending"></i> LIMITÉ</span>
        </div>
      </div>

      ${renderWorkflowFilters(matches)}
      ${meta?.error ? renderError(meta) : ""}
      ${matches.length === 0 ? renderEmpty() : renderMatches(matches)}

      <details class="ff-cockpit sl-panel">
        <summary>
          <span><small>COCKPIT</small><strong>Lecture rapide & contexte</strong></span>
          <b>Ouvrir</b>
        </summary>
        <div class="ff-cockpit__content">
          <section class="ff-cockpit__signal">
            <small>SIGNAL DU JOUR</small>
            <strong>${dominantTrend(stats)}</strong>
            <p>${dominantTrendNote(stats)}</p>
          </section>
          <section class="ff-cockpit__metrics">
            <div><span>Over</span><strong>${stats.over}</strong></div>
            <div><span>Under</span><strong>${stats.under}</strong></div>
            <div><span>Compétitions</span><strong>${safe(meta?.competitions || "Toutes")}</strong></div>
            <div><span>Dernière synchro</span><strong>${formatCompactDateTime(meta?.syncedAt)}</strong></div>
          </section>
          <p class="ff-sidebar__notice">Les tendances sont des projections statistiques. La ligne et la cote Betclic restent nécessaires pour calculer une VALUE.</p>
        </div>
      </details>
      ${renderMethodPanel()}
    </main>
  `;
}

function renderError(meta) {
  return `
    <div class="ff-alert" role="status">
      <span aria-hidden="true">⚠</span>
      <div><strong>Synchronisation rugby limitée</strong><p>${safe(meta?.errorMessage || "Les données FrenchFlair ne sont pas disponibles pour le moment.")}</p></div>
    </div>
  `;
}

function renderEmpty() {
  return `
    <section class="ff-empty sl-panel">
      <span aria-hidden="true">🏉</span>
      <h3>Aucune rencontre à analyser</h3>
      <p>Les prochains matchs apparaîtront ici après la prochaine synchronisation rugby.</p>
    </section>
  `;
}

function renderWorkflowFilters(matches) {
  const counts = { all: matches.length, new:0, pending:0, analyzed:0, value:0, tracked:0, resulted:0, archived:0 };
  matches.forEach(match => {
    const state = deriveFrenchFlairWorkflowState(match, getFrenchFlairMatchWorkflow(match?.id));
    if (Object.hasOwn(counts, state)) counts[state] += 1;
  });
  const filters = [
    ["all", "Tous", counts.all], ["new", "Nouveaux", counts.new],
    ["pending", "À analyser", counts.pending], ["analyzed", "Analysés", counts.analyzed],
    ["value", "VALUE", counts.value], ["tracked", "Paris", counts.tracked],
    ["resulted", "Résultats", counts.resulted], ["archived", "Archives", counts.archived]
  ];
  return `
    <section class="ff-control-center sl-panel" aria-label="Recherche et tri FrenchFlair">
      <div class="ff-control-center__top">
        <label class="ff-search-field">
          <span>Recherche</span>
          <input type="search" inputmode="search" autocomplete="off" placeholder="Équipe ou compétition…" data-ff-search>
        </label>
        <label class="ff-sort-field">
          <span>Trier par</span>
          <select data-ff-sort>
            <option value="date-asc">Date · prochain d’abord</option>
            <option value="date-desc">Date · plus lointain</option>
            <option value="confidence-desc">Confiance · élevée</option>
            <option value="total-desc">Total modèle · élevé</option>
            <option value="sigma-asc">Sigma · faible</option>
            <option value="value-first">VALUE · prioritaire</option>
            <option value="status">État du workflow</option>
          </select>
        </label>
        <div class="ff-density-control" role="group" aria-label="Densité d’affichage">
          <button type="button" data-ff-density="comfort">Confort</button>
          <button type="button" data-ff-density="compact">Compact</button>
        </div>
        <button type="button" class="sl-button sl-button-ghost ff-reset-controls" data-ff-reset>Réinitialiser</button>
      </div>
      <nav class="ff-workflow-filters" aria-label="Filtres du workflow FrenchFlair">
        <div class="ff-workflow-filters__buttons">
          ${filters.map(([key,label,count]) => `<button type="button" class="ff-workflow-filter" data-ff-filter="${key}">${label}<b>${count}</b></button>`).join("")}
        </div>
        <span><strong data-ff-visible-count>${counts.all}</strong> affiché(s)</span>
      </nav>
      <p class="ff-control-summary" data-ff-summary>${counts.all} rencontre(s) affichée(s)</p>
    </section>`;
}

function renderMatches(matches) {
  return `
    <div class="ff-match-grid" data-ff-grid>
      ${matches.map((match, index) => renderMatchCard(match, index)).join("")}
    </div>
  `;
}

function renderMatchCard(match, index) {
  const predictionAvailable = match.predictionStatus === "OK";
  const trend = match.recommendedTrend === "OVER" ? "OVER" : "UNDER";
  const confidence = Number(match.confidence) || 0;
  const total = formatNumber(match.predictedTotalPoints);
  const sigma = formatNumber(match.sigma);
  const id = safeAttribute(match.id);
  const workflow = getFrenchFlairMatchWorkflow(match.id);
  const workflowState = deriveFrenchFlairWorkflowState(match, workflow);

  return `
    <article
      class="ff-match-card ${predictionAvailable ? `ff-match-card--${trend.toLowerCase()}` : "ff-match-card--pending"} ff-workflow-state--${workflowState}"
      id="ff-${trend.toLowerCase()}-${id}"
      data-ff-card
      data-match-id="${id}"
      data-workflow-state="${workflowState}"
      data-search="${safeAttribute(`${match.home || ""} ${match.away || ""} ${match.competition || ""}`.toLowerCase())}"
      data-date="${safeAttribute(new Date(match.date || 0).getTime())}"
      data-confidence="${safeAttribute(confidence)}"
      data-total="${safeAttribute(Number(match.predictedTotalPoints) || 0)}"
      data-sigma="${safeAttribute(Number(match.sigma) || 999)}"
      style="--ff-delay:${Math.min(index, 8) * 45}ms"
    >
      <div class="ff-match-card__rail" aria-hidden="true"></div>
      <header class="ff-match-card__header">
        <div class="ff-match-card__meta">
          <span class="ff-competition">${safe(match.competition || "Compétition rugby")}</span>
          <span class="ff-kickoff">${formatDate(match.date)} · ${formatTime(match.date)}</span>
        </div>
        <span class="ff-workflow-badge" data-ff-status-label>${safe(statusLabel(workflowState)).toUpperCase()}</span>
        ${predictionAvailable ? `
          <span class="ff-trend-badge ff-trend-badge--${trend.toLowerCase()}">
            <i>${trend === "OVER" ? "↗" : "↘"}</i>${trend}
          </span>
        ` : `<span class="ff-trend-badge ff-trend-badge--pending">EN ATTENTE</span>`}
      </header>

      <section class="ff-match-card__teams" aria-label="${safeAttribute(match.home)} contre ${safeAttribute(match.away)}">
        <div class="ff-team">
          <span>${teamFlag(match.home)}</span>
          <div><small>DOMICILE</small><strong>${safe(translateTeamName(match.home || "Équipe inconnue"))}</strong></div>
        </div>
        <div class="ff-versus"><span>VS</span><i></i></div>
        <div class="ff-team ff-team--away">
          <div><small>EXTÉRIEUR</small><strong>${safe(translateTeamName(match.away || "Équipe inconnue"))}</strong></div>
          <span>${teamFlag(match.away)}</span>
        </div>
      </section>

      ${predictionAvailable ? `
        <section class="ff-model-board">
          <div class="ff-model-board__total">
            <span>TOTAL MODÈLE</span>
            <strong>${total}<small>pts</small></strong>
            <p>Référence historique : ${formatNumber(match.historicalReferenceTotal)} pts</p>
          </div>
          <div class="ff-model-board__split">
            <div><span>${shortTeam(match.home)}</span><strong>${formatNumber(match.predictedHomePoints)}</strong></div>
            <i>+</i>
            <div><span>${shortTeam(match.away)}</span><strong>${formatNumber(match.predictedAwayPoints)}</strong></div>
          </div>
        </section>

        <section class="ff-indicator-grid">
          ${renderMetric("Zone probable", `${formatNumber(match.predictedRangeLow)} – ${formatNumber(match.predictedRangeHigh)}`, "points")}
          ${renderMetric("Sigma", sigma, "dispersion")}
          ${renderMetric("Confiance", `${confidence}%`, confidenceLabel(confidence))}
        </section>

        <div class="ff-confidence-line">
          <div><span>Solidité de la projection</span><strong>${confidence}%</strong></div>
          <div class="ff-meter"><i style="width:${clamp(confidence, 0, 100)}%"></i></div>
        </div>
      ` : `
        <section class="ff-prediction-missing">
          <span aria-hidden="true">◌</span>
          <div><strong>Historique insuffisant</strong><p>La projection sera calculée dès que les données nécessaires seront disponibles.</p></div>
        </section>
      `}

      <details class="ff-details">
        <summary>Voir les repères du modèle <span>+</span></summary>
        <div class="ff-details__content">
          <p><strong>Moyenne ± Sigma :</strong> ${predictionAvailable ? `${total} ± ${sigma} points` : "indisponible"}</p>
          <p><strong>Lecture :</strong> ${predictionAvailable ? trendExplanation(trend) : "Aucune tendance exploitable sans historique suffisant."}</p>
        </div>
      </details>

      ${renderWorkflowTimeline(workflowState)}
      <footer class="ff-match-card__footer ff-workflow-actions">
        ${renderWorkflowActions(workflowState, id, predictionAvailable)}
        <div class="ff-card-status"><i></i><span>${workflowStatusNote(workflowState)}</span></div>
      </footer>

      <section class="ff-workflow-panel" data-ff-workflow-details hidden>
        <strong>Détails du workflow</strong>
        <p>État courant : ${safe(statusLabel(workflowState))}. La ligne, la cote et la décision restent gérées par le moteur FrenchFlair existant.</p>
      </section>
      ${renderWorkflowHistory(workflow, match)}
      <div id="ff-result-${id}" class="analysis-result ff-analysis-result"></div>
    </article>
  `;
}

function renderWorkflowTimeline(state) {
  const order = ["new","pending","analyzed","decided","value","tracked","resulted","archived"];
  const index = order.indexOf(state);
  const done = key => index >= order.indexOf(key);
  return `<div class="ff-workflow-timeline" aria-label="Progression de l’analyse">
    <span class="${done("pending") ? "is-done" : ""}">Ouvert</span>
    <i></i><span class="${done("analyzed") ? "is-done" : ""}">Analysé</span>
    <i></i><span class="${done("decided") ? "is-done" : ""}">Décidé</span>
    <i></i><span class="${done("tracked") ? "is-done" : ""}">Suivi</span>
  </div>`;
}

function renderWorkflowActions(state, id, predictionAvailable) {
  const primary = state === "new" ? ["start","Commencer"] : state === "pending" ? ["continue","Continuer"] : ["history","Historique"];
  return `<div class="ff-workflow-actions__buttons">
    ${predictionAvailable ? `<button type="button" class="sl-button sl-button-primary ff-analyse-button" onclick="analyzeFrenchFlairValue('${id}')"><span>Analyser la VALUE</span><span aria-hidden="true">→</span></button>` : ""}
    <button type="button" class="sl-button sl-button-secondary" data-ff-action="${primary[0]}">${primary[1]}</button>
    ${state === "pending" ? `<button type="button" class="sl-button sl-button-ghost" data-ff-action="complete">Terminer</button>` : ""}
    <button type="button" class="sl-button sl-button-ghost" data-ff-action="details" aria-expanded="false">Détails</button>
    ${primary[0] !== "history" ? `<button type="button" class="sl-button sl-button-ghost" data-ff-action="history" aria-expanded="false">Historique</button>` : ""}
    ${state !== "archived" ? `<button type="button" class="sl-button sl-button-ghost" data-ff-action="archive">Archiver</button>` : ""}
  </div>`;
}

function renderWorkflowHistory(workflow, match) {
  const base = { label:"Match importé", note:`${match.home || "Équipe"} vs ${match.away || "Équipe"}`, at:workflow?.createdAt || Date.parse(match.date || "") || Date.now() };
  const events = [base, ...(Array.isArray(workflow?.history) ? workflow.history : [])];
  return `<section class="ff-workflow-history" data-ff-history hidden><strong>Journal de la rencontre</strong>${events.map(event => `<article><time>${formatCompactDateTime(event.at)}</time><div><b>${safe(event.label || "Événement")}</b>${event.note ? `<p>${safe(event.note)}</p>` : ""}</div></article>`).join("")}</section>`;
}

function workflowStatusNote(state) {
  return ({ new:"Rencontre nouvellement importée", pending:"Analyse en cours", analyzed:"Analyse terminée", decided:"Décision enregistrée", value:"VALUE détectée", tracked:"Pari enregistré", resulted:"Résultat disponible", archived:"Rencontre archivée" })[state] || "Ligne et cote à renseigner";
}

function renderMetric(label, value, note) {
  return `<div class="ff-metric"><span>${label}</span><strong>${value}</strong><small>${note}</small></div>`;
}

function renderMethodPanel() {
  return `
    <details class="ff-method ff-method--compact sl-panel" id="ff-method">
      <summary>
        <span><small>MÉTHODE FRENCHFLAIR</small><strong>Comprendre les trois repères</strong></span>
        <b>Afficher</b>
      </summary>
      <div class="ff-method__steps">
        <article><b>01</b><strong>Total modèle</strong><p>Projection combinée des points attendus pour les deux équipes.</p></article>
        <article><b>02</b><strong>Sigma</strong><p>Dispersion utilisée pour mesurer l’incertitude autour de la projection.</p></article>
        <article><b>03</b><strong>VALUE</strong><p>Comparaison calculée après saisie de la ligne et de la cote Betclic.</p></article>
      </div>
    </details>
  `;
}

function computePageStats(matches, meta) {
  const available = matches.filter(match => match.predictionStatus === "OK");
  const over = available.filter(match => match.recommendedTrend === "OVER").length;
  const under = available.filter(match => match.recommendedTrend !== "OVER").length;
  const avgConfidence = Math.round(average(available.map(match => match.confidence)));
  const avgTotal = average(available.map(match => match.predictedTotalPoints));
  const avgSigma = average(available.map(match => match.sigma));
  const total = matches.length || Number(meta?.visibleTotal || meta?.total || 0);

  const workflow = { new:0, pending:0, analyzed:0, decided:0, value:0, tracked:0, resulted:0, archived:0 };
  matches.forEach(match => {
    const state = deriveFrenchFlairWorkflowState(match, getFrenchFlairMatchWorkflow(match?.id));
    if (Object.hasOwn(workflow, state)) workflow[state] += 1;
  });
  return {
    total,
    available: available.length,
    over,
    under,
    avgConfidence,
    avgTotal,
    avgSigma,
    workflow,
    coverage: total > 0 ? Math.round((available.length / total) * 100) : 0
  };
}

function dominantTrend(stats) {
  if (!stats.available) return "En attente";
  if (stats.over === stats.under) return "Lecture équilibrée";
  return stats.over > stats.under ? "Orientation OVER" : "Orientation UNDER";
}

function dominantTrendNote(stats) {
  if (!stats.available) return "Aucune projection exploitable actuellement.";
  if (stats.over === stats.under) return "Les deux tendances sont représentées à parts égales.";
  const count = Math.max(stats.over, stats.under);
  return `${count} rencontre${count > 1 ? "s" : ""} partage${count > 1 ? "nt" : ""} cette orientation.`;
}

function trendExplanation(trend) {
  return trend === "OVER"
    ? "Le total projeté se situe au-dessus de la référence historique du modèle."
    : "Le total projeté se situe sous la référence historique du modèle.";
}

function formatPeriod(meta) {
  if (!meta?.from && !meta?.to) return "PROCHAINS MATCHS";
  return `${compactDate(meta.from)} → ${compactDate(meta.to)}`;
}

function compactDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return safe(value);
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }).replace(".", "");
}

function relativeSync(value) {
  if (!value) return "récemment";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "récemment";
  const minutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));
  if (minutes < 2) return "à l’instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.round(minutes / 60);
  return hours < 24 ? `il y a ${hours} h` : formatCompactDateTime(value);
}

function formatCompactDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return safe(value);
  return date.toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function formatDate(value) {
  if (!value) return "Date à confirmer";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return safe(value);
  return date.toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short" }).replace(".", "");
}

function formatTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function formatNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(1) : "0.0";
}

function confidenceLabel(confidence) {
  const value = Number(confidence) || 0;
  if (value >= 80) return "Confiance forte";
  if (value >= 65) return "Confiance correcte";
  if (value >= 50) return "Confiance moyenne";
  return "Confiance prudente";
}

function average(values) {
  const clean = values.map(Number).filter(Number.isFinite);
  return clean.length ? clean.reduce((sum, value) => sum + value, 0) / clean.length : 0;
}

function shortTeam(name) {
  const translated = translateTeamName(name || "Équipe");
  return safe(translated.length > 14 ? `${translated.slice(0, 12)}…` : translated);
}

function teamFlag(name) {
  return getFlag(name) || "🏉";
}

function translateTeamName(name) {
  const normalized = String(name || "").toLowerCase();
  const names = {
    "new zealand": "Nouvelle-Zélande", "italy": "Italie", "australia": "Australie",
    "france": "France", "la france": "France", "japan": "Japon", "le japon": "Japon",
    "ireland": "Irlande", "fiji": "Fidji", "england": "Angleterre",
    "south africa": "Afrique du Sud", "scotland": "Écosse", "l'écosse": "Écosse",
    "argentina": "Argentine", "wales": "Pays de Galles"
  };
  return names[normalized] || name;
}

function getFlag(name) {
  const normalized = String(name || "").toLowerCase();
  const flags = {
    "france": "🇫🇷", "la france": "🇫🇷", "nouvelle-zélande": "🇳🇿", "new zealand": "🇳🇿",
    "australie": "🇦🇺", "australia": "🇦🇺", "afrique du sud": "🇿🇦", "south africa": "🇿🇦",
    "angleterre": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "england": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "écosse": "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
    "l'écosse": "🏴󠁧󠁢󠁳󠁣󠁴󠁿", "scotland": "🏴󠁧󠁢󠁳󠁣󠁴󠁿", "pays de galles": "🏴󠁧󠁢󠁷󠁬󠁳󠁿",
    "wales": "🏴󠁧󠁢󠁷󠁬󠁳󠁿", "irlande": "🇮🇪", "ireland": "🇮🇪", "italie": "🇮🇹", "italy": "🇮🇹",
    "japon": "🇯🇵", "le japon": "🇯🇵", "japan": "🇯🇵", "fidji": "🇫🇯", "fiji": "🇫🇯",
    "argentine": "🇦🇷", "argentina": "🇦🇷", "namibia": "🇳🇦", "namibie": "🇳🇦"
  };
  return flags[normalized] || "";
}

function sortByDate(matches) {
  return [...matches].sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
}

function clamp(value, min, max) {
  return Math.min(Math.max(Number(value) || 0, min), max);
}

function safe(value) {
  return String(value ?? "—")
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function safeAttribute(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("'", "&#039;")
    .replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
