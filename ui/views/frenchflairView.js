/**
 * SPORTLAB V6.5.0 — FRENCHFLAIR PREMIUM
 * Sprint 6.1 — Structure Premium
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
  return `
    <header class="ff-hero sl-panel">
      <div class="ff-hero__ambient" aria-hidden="true"></div>
      <div class="ff-hero__content">
        <div class="ff-hero__copy">
          <span class="ff-eyebrow">🏉 FRENCHFLAIR · RUGBY TOTALS</span>
          <h1>Le terrain d’analyse<br><span>Over / Under</span></h1>
          <p>
            Projections de points, dispersion du modèle et lecture de tendance
            réunies dans un espace de décision clair et mobile-first.
          </p>
          <div class="ff-hero__actions">
            <a class="sl-button sl-button-primary ff-primary-action" href="#ff-match-list">
              Voir les rencontres <span aria-hidden="true">↓</span>
            </a>
            <span class="ff-sync-pill">
              <i aria-hidden="true"></i>
              ${meta?.error ? "Synchronisation limitée" : `Synchronisé ${relativeSync(meta?.syncedAt)}`}
            </span>
          </div>
        </div>

        <div class="ff-scoreboard" aria-label="Synthèse FrenchFlair">
          <div class="ff-scoreboard__topline">
            <span>SESSION ACTIVE</span>
            <strong>${formatPeriod(meta)}</strong>
          </div>
          <div class="ff-scoreboard__focus">
            <div>
              <small>RENCONTRES</small>
              <strong>${stats.total}</strong>
            </div>
            <span class="ff-scoreboard__divider">/</span>
            <div>
              <small>PRÉDICTIONS</small>
              <strong>${stats.available}</strong>
            </div>
          </div>
          <div class="ff-scoreboard__trend">
            <div class="ff-scoreboard__trend-item ff-scoreboard__trend-item--over">
              <span>↗</span><strong>${stats.over}</strong><small>tendances OVER</small>
            </div>
            <div class="ff-scoreboard__trend-item ff-scoreboard__trend-item--under">
              <span>↘</span><strong>${stats.under}</strong><small>tendances UNDER</small>
            </div>
          </div>
          <div class="ff-scoreboard__confidence">
            <span>Confiance moyenne</span>
            <strong>${stats.avgConfidence}%</strong>
            <div class="ff-meter"><i style="width:${clamp(stats.avgConfidence, 0, 100)}%"></i></div>
          </div>
        </div>
      </div>
    </header>
  `;
}

function renderKpiRail(stats) {
  return `
    <section class="ff-kpi-rail" aria-label="Indicateurs FrenchFlair">
      ${renderHeroKpi("Matchs visibles", stats.total, "Calendrier actif", "calendar")}
      ${renderHeroKpi("Modèles disponibles", stats.available, `${stats.coverage}% de couverture`, "model")}
      ${renderHeroKpi("Projection moyenne", `${formatNumber(stats.avgTotal)} pts`, "Total modèle", "total")}
      ${renderHeroKpi("Sigma moyen", `${formatNumber(stats.avgSigma)} pts`, "Dispersion", "sigma")}
      ${renderHeroKpi("Confiance", `${stats.avgConfidence}%`, confidenceLabel(stats.avgConfidence), "confidence")}
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
    <div class="ff-layout">
      <aside class="ff-sidebar sl-panel" aria-label="Cockpit FrenchFlair">
        <div class="ff-sidebar__heading">
          <span>COCKPIT</span>
          <strong>Lecture rapide</strong>
        </div>

        <nav class="ff-sidebar__nav">
          <a class="is-active" href="#ff-match-list"><span>◉</span> Rencontres <b>${stats.total}</b></a>
          <a href="#ff-over"><span>↗</span> Tendance Over <b>${stats.over}</b></a>
          <a href="#ff-under"><span>↘</span> Tendance Under <b>${stats.under}</b></a>
          <a href="#ff-method"><span>∑</span> Lecture modèle</a>
        </nav>

        <div class="ff-sidebar__separator"></div>

        <section class="ff-sidebar__signal">
          <span class="ff-sidebar__signal-icon">◎</span>
          <div>
            <small>SIGNAL DU JOUR</small>
            <strong>${dominantTrend(stats)}</strong>
            <p>${dominantTrendNote(stats)}</p>
          </div>
        </section>

        <section class="ff-sidebar__meta">
          <div><span>Compétitions</span><strong>${safe(meta?.competitions || "Toutes")}</strong></div>
          <div><span>Masqués</span><strong>${Number(meta?.hiddenTotal || 0)}</strong></div>
          <div><span>Dernière synchro</span><strong>${formatCompactDateTime(meta?.syncedAt)}</strong></div>
        </section>

        <p class="ff-sidebar__notice">
          Les tendances sont des projections statistiques. La saisie de la ligne et de la cote reste nécessaire pour calculer une VALUE.
        </p>
      </aside>

      <main class="ff-workspace" id="ff-match-list">
        <div class="ff-workspace__header">
          <div>
            <span class="ff-section-label">ANALYSES DISPONIBLES</span>
            <h2>Rencontres à examiner</h2>
            <p>${stats.available} modèle${stats.available > 1 ? "s" : ""} exploitable${stats.available > 1 ? "s" : ""} sur ${stats.total} rencontre${stats.total > 1 ? "s" : ""}.</p>
          </div>
          <div class="ff-legend" aria-label="Légende">
            <span><i class="is-over"></i> OVER</span>
            <span><i class="is-under"></i> UNDER</span>
            <span><i class="is-pending"></i> Données limitées</span>
          </div>
        </div>

        ${meta?.error ? renderError(meta) : ""}
        ${matches.length === 0 ? renderEmpty() : renderMatches(matches)}
        ${renderMethodPanel()}
      </main>
    </div>
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

function renderMatches(matches) {
  return `
    <div class="ff-match-grid">
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

  return `
    <article
      class="ff-match-card ${predictionAvailable ? `ff-match-card--${trend.toLowerCase()}` : "ff-match-card--pending"}"
      id="ff-${trend.toLowerCase()}-${id}"
      style="--ff-delay:${Math.min(index, 8) * 45}ms"
    >
      <div class="ff-match-card__rail" aria-hidden="true"></div>
      <header class="ff-match-card__header">
        <div class="ff-match-card__meta">
          <span class="ff-competition">${safe(match.competition || "Compétition rugby")}</span>
          <span class="ff-kickoff">${formatDate(match.date)} · ${formatTime(match.date)}</span>
        </div>
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

      <footer class="ff-match-card__footer">
        <button
          type="button"
          class="sl-button sl-button-primary ff-analyse-button"
          onclick="analyzeFrenchFlairValue('${id}')"
          ${predictionAvailable ? "" : "aria-describedby=\"ff-pending-note\""}
        >
          <span>Analyser la VALUE</span><span aria-hidden="true">→</span>
        </button>
        <div class="ff-card-status"><i></i><span>Ligne et cote à renseigner</span></div>
      </footer>

      <div id="ff-result-${id}" class="analysis-result ff-analysis-result"></div>
    </article>
  `;
}

function renderMetric(label, value, note) {
  return `<div class="ff-metric"><span>${label}</span><strong>${value}</strong><small>${note}</small></div>`;
}

function renderMethodPanel() {
  return `
    <section class="ff-method sl-panel" id="ff-method">
      <div class="ff-method__intro">
        <span class="ff-section-label">MÉTHODE FRENCHFLAIR</span>
        <h3>Trois repères avant la décision</h3>
        <p>La structure Premium met en avant les informations utiles sans modifier le moteur statistique existant.</p>
      </div>
      <div class="ff-method__steps">
        <article><b>01</b><strong>Total modèle</strong><p>Projection combinée des points attendus pour les deux équipes.</p></article>
        <article><b>02</b><strong>Sigma</strong><p>Mesure de dispersion qui encadre l’incertitude autour de la projection.</p></article>
        <article><b>03</b><strong>VALUE</strong><p>Comparaison calculée après saisie de la ligne et de la cote disponibles.</p></article>
      </div>
    </section>
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

  return {
    total,
    available: available.length,
    over,
    under,
    avgConfidence,
    avgTotal,
    avgSigma,
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
