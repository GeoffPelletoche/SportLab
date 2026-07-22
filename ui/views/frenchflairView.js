/**
 * SPORTLAB V6.3.5.1 — FRENCHFLAIR VIEW
 * Refonte visuelle Premium.
 *
 * Logique métier, IDs et fonctions globales conservés.
 */

export function renderFrenchFlair(payload) {
  const matches = sortByDate(payload?.matches || []);
  const meta = payload?.meta || null;

  return `
    <section class="analysis-page analysis-page--frenchflair">
      ${renderMeta(meta)}
      ${matches.length === 0 ? renderEmpty(meta) : renderMatches(matches)}
    </section>
  `;
}

function renderMeta(meta) {
  if (!meta) {
    return `
      <div class="analysis-state analysis-state--muted">
        <span class="analysis-state__icon" aria-hidden="true">⚠️</span>
        <div>
          <strong>Synchronisation rugby non disponible</strong>
          <p class="small">Les informations FrenchFlair ne peuvent pas être affichées.</p>
        </div>
      </div>
    `;
  }

  return `
    <section class="analysis-summary analysis-summary--frenchflair" aria-label="Résumé FrenchFlair">
      <div class="analysis-summary__heading">
        <div>
          <p class="analysis-eyebrow">🏉 FrenchFlair</p>
          <h2>Analyses des totaux de points</h2>
        </div>

        <span class="analysis-summary__status">
          ${meta.total || 0} match${Number(meta.total) > 1 ? "s" : ""}
        </span>
      </div>

      <div class="analysis-summary__grid">
        ${renderSummaryItem("Période", `${safe(meta.from)} → ${safe(meta.to)}`)}
        ${renderSummaryItem("Compétitions", safe(meta.competitions))}
        ${renderSummaryItem("Matchs trouvés", safe(meta.total))}
        ${renderSummaryItem("Dernière synchro", formatDateTime(meta.syncedAt))}
      </div>
    </section>
  `;
}

function renderSummaryItem(label, value) {
  return `
    <div class="analysis-summary__item">
      <span>${label}</span>
      <strong>${value || "-"}</strong>
    </div>
  `;
}

function renderEmpty() {
  return `
    <section class="analysis-empty">
      <div class="analysis-empty__icon" aria-hidden="true">🏉</div>
      <h3>Aucun match rugby trouvé</h3>
      <p>Aucune rencontre n’est disponible sur la période analysée.</p>
    </section>
  `;
}

function renderMatches(matches) {
  return `
    <div class="analysis-grid">
      ${matches.map((match) => renderMatchCard(match)).join("")}
    </div>
  `;
}

function renderMatchCard(match) {
  const predictionAvailable = match.predictionStatus === "OK";
  const trend = match.recommendedTrend === "OVER" ? "OVER" : "UNDER";
  const trendIcon = trend === "OVER" ? "📈" : "📉";

  return `
    <article class="analysis-card analysis-card--frenchflair">
      <header class="analysis-card__header">
        <div>
          <p class="analysis-card__competition">🏉 ${safe(match.competition || "Compétition")}</p>
          <p class="analysis-card__date">${formatDate(match.date)} · ${formatTime(match.date)}</p>
        </div>

        ${predictionAvailable ? `
          <span class="analysis-decision analysis-decision--trend analysis-decision--${trend.toLowerCase()}">
            ${trendIcon} ${trend}
          </span>
        ` : `
          <span class="analysis-decision analysis-decision--pass">INDISPONIBLE</span>
        `}
      </header>

      <div class="analysis-matchup analysis-matchup--stacked-mobile">
        <div class="analysis-team">
          <span class="analysis-team__role">Équipe 1</span>
          <strong>${teamLabel(match.home)}</strong>
        </div>

        <div class="analysis-vs" aria-label="contre">
          <span>VS</span>
        </div>

        <div class="analysis-team analysis-team--away">
          <span class="analysis-team__role">Équipe 2</span>
          <strong>${teamLabel(match.away)}</strong>
        </div>
      </div>

      ${renderPrediction(match)}

      <footer class="analysis-card__footer">
        <button
          type="button"
          class="analysis-button analysis-button--frenchflair"
          onclick="analyzeFrenchFlairValue('${safeAttribute(match.id)}')"
        >
          <span>Analyser la value</span>
          <span aria-hidden="true">→</span>
        </button>

        <div id="ff-result-${safeAttribute(match.id)}" class="analysis-result"></div>
      </footer>
    </article>
  `;
}

function renderPrediction(match) {
  if (match.predictionStatus !== "OK") {
    return `
      <div class="analysis-state analysis-state--inline">
        <span class="analysis-state__icon" aria-hidden="true">ℹ️</span>
        <div>
          <strong>Prédiction indisponible</strong>
          <p class="small">Les données nécessaires ne sont pas encore suffisantes.</p>
        </div>
      </div>
    `;
  }

  const confidence = Number(match.confidence) || 0;
  const total = formatNumber(match.predictedTotalPoints);
  const sigma = formatNumber(match.sigma);

  return `
    <section class="analysis-prediction">
      <div class="analysis-total">
        <span>Total prédit</span>
        <strong>${total}<small> pts</small></strong>
        <p>${match.recommendedTrend === "OVER" ? "📈 Tendance OVER" : "📉 Tendance UNDER"}</p>
      </div>

      <div class="analysis-kpis">
        ${renderKpi(teamLabel(match.home), `${formatNumber(match.predictedHomePoints)} pts`, "Projection équipe")}
        ${renderKpi(teamLabel(match.away), `${formatNumber(match.predictedAwayPoints)} pts`, "Projection équipe")}
        ${renderKpi("Sigma", `${sigma} pts`, "Dispersion modèle")}
      </div>

      <div class="analysis-range">
        <div>
          <span>Zone probable</span>
          <strong>
            ${formatNumber(match.predictedRangeLow)}
            –
            ${formatNumber(match.predictedRangeHigh)}
            pts
          </strong>
        </div>

        <span class="analysis-confidence ${confidenceClass(confidence)}">
          ${confidenceLabel(confidence)} · ${confidence}%
        </span>
      </div>

      <div class="analysis-progress" aria-label="Niveau de confiance">
        <div class="analysis-progress__heading">
          <span>Confiance du modèle</span>
          <strong>${confidence}%</strong>
        </div>

        <div class="analysis-progress__track">
          <span style="width:${clamp(confidence, 0, 100)}%"></span>
        </div>
      </div>

      <p class="analysis-model-note">
        Moyenne ± Sigma : ${total} ± ${sigma} points
      </p>
    </section>
  `;
}

function renderKpi(label, value, note) {
  return `
    <div class="analysis-kpi">
      <span>${label}</span>
      <strong>${value}</strong>
      <small>${note}</small>
    </div>
  `;
}

function teamLabel(name) {
  if (!name) return "Équipe inconnue";
  const flag = getFlag(name);
  const translated = translateTeamName(name);
  return `${flag ? `${flag} ` : ""}${safe(translated)}`;
}

function translateTeamName(name) {
  const normalized = String(name).toLowerCase();

  const names = {
    "new zealand": "Nouvelle-Zélande",
    "italy": "Italie",
    "australia": "Australie",
    "france": "France",
    "la france": "France",
    "japan": "Japon",
    "le japon": "Japon",
    "ireland": "Irlande",
    "fiji": "Fidji",
    "england": "Angleterre",
    "south africa": "Afrique du Sud",
    "scotland": "Écosse",
    "l'écosse": "Écosse",
    "argentina": "Argentine",
    "wales": "Pays de Galles"
  };

  return names[normalized] || name;
}

function getFlag(name) {
  const normalized = String(name).toLowerCase();

  const flags = {
    "france": "🇫🇷",
    "la france": "🇫🇷",
    "nouvelle-zélande": "🇳🇿",
    "new zealand": "🇳🇿",
    "australie": "🇦🇺",
    "australia": "🇦🇺",
    "afrique du sud": "🇿🇦",
    "south africa": "🇿🇦",
    "angleterre": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    "england": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    "écosse": "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
    "l'écosse": "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
    "scotland": "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
    "pays de galles": "🏴󠁧󠁢󠁷󠁬󠁳󠁿",
    "wales": "🏴󠁧󠁢󠁷󠁬󠁳󠁿",
    "irlande": "🇮🇪",
    "ireland": "🇮🇪",
    "italie": "🇮🇹",
    "italy": "🇮🇹",
    "japon": "🇯🇵",
    "le japon": "🇯🇵",
    "japan": "🇯🇵",
    "fidji": "🇫🇯",
    "fiji": "🇫🇯",
    "argentine": "🇦🇷",
    "argentina": "🇦🇷",
    "namibia": "🇳🇦",
    "namibie": "🇳🇦"
  };

  return flags[normalized] || "";
}

function sortByDate(matches) {
  return [...matches].sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
}

function formatDate(value) {
  if (!value) return "-";

  try {
    return new Date(value).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric"
    });
  } catch {
    return safe(value);
  }
}

function formatTime(value) {
  if (!value) return "-";

  try {
    return new Date(value).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short"
    });
  } catch {
    return "-";
  }
}

function formatDateTime(value) {
  if (!value) return "-";

  try {
    return new Date(value).toLocaleString("fr-FR");
  } catch {
    return safe(value);
  }
}

function formatNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(1) : "0.0";
}

function confidenceLabel(confidence) {
  if (confidence >= 80) return "Confiance forte";
  if (confidence >= 65) return "Confiance correcte";
  if (confidence >= 50) return "Confiance moyenne";
  return "Confiance faible";
}

function confidenceClass(confidence) {
  if (confidence >= 65) return "analysis-confidence--good";
  if (confidence >= 50) return "analysis-confidence--medium";
  return "analysis-confidence--low";
}

function clamp(value, min, max) {
  return Math.min(Math.max(Number(value) || 0, min), max);
}

function safe(value) {
  return String(value ?? "-")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeAttribute(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
