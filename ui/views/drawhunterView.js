/**
 * SPORTLAB V6.3.5.1 — DRAWHUNTER VIEW
 * Refonte visuelle Premium, logique métier inchangée.
 */

export function renderDrawHunter(payload) {
  const matches = payload?.matches || [];
  const meta = payload?.meta || null;

  return `
    <section class="analysis-page analysis-page--drawhunter">
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
          <strong>Synchronisation non disponible</strong>
          <p class="small">Les informations DrawHunter ne peuvent pas être affichées pour le moment.</p>
        </div>
      </div>
    `;
  }

  return `
    <section class="analysis-summary analysis-summary--drawhunter" aria-label="Résumé DrawHunter">
      <div class="analysis-summary__heading">
        <div>
          <p class="analysis-eyebrow">⚽ DrawHunter</p>
          <h2>Analyses des matchs nuls</h2>
        </div>
        <span class="analysis-summary__status">
          ${meta.total || 0} match${Number(meta.total) > 1 ? "s" : ""}
        </span>
      </div>

      <div class="analysis-summary__grid">
        ${renderSummaryItem("Période", `${safe(meta.from)} → ${safe(meta.to)}`)}
        ${renderSummaryItem("Compétitions", safe(meta.competitions))}
        ${renderSummaryItem("Matchs trouvés", safe(meta.total))}
        ${renderSummaryItem("Dernière synchro", formatDate(meta.syncedAt))}
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

function renderEmpty(meta) {
  return `
    <section class="analysis-empty">
      <div class="analysis-empty__icon" aria-hidden="true">⚽</div>
      <h3>Aucun match trouvé</h3>
      <p>
        Aucune rencontre n’est disponible sur la période analysée. Cela peut provenir
        du calendrier, du quota API ou de l’abonnement.
      </p>

      ${meta?.syncLog?.length ? `
        <div class="analysis-sync-log">
          <h4>Détail de la synchronisation</h4>
          ${meta.syncLog.map(item => `
            <div class="analysis-sync-log__item">
              <strong>${safe(item.competition)}</strong>
              <span>${safe(item.status)} · ${safe(item.count)} match(s)</span>
              ${item.message ? `<small>${safe(item.message)}</small>` : ""}
            </div>
          `).join("")}
        </div>
      ` : ""}
    </section>
  `;
}

function renderMatches(matches) {
  return `
    <div class="analysis-grid">
      ${matches.map((match, index) => renderMatchCard(match, index)).join("")}
    </div>
  `;
}

function renderMatchCard(match, index) {
  const isValue = match.decision === "VALUE BET";
  const probability = toPercent(match.probability);
  const value = toPercent(match.value);

  return `
    <article class="analysis-card analysis-card--drawhunter ${isValue ? "analysis-card--value" : ""}">
      <header class="analysis-card__header">
        <div>
          <p class="analysis-card__competition">⚽ ${safe(match.competition || "Compétition")}</p>
          <p class="analysis-card__date">${formatDate(match.date)}</p>
        </div>
        <span class="analysis-decision ${isValue ? "analysis-decision--value" : "analysis-decision--pass"}">
          ${safe(match.decision || "À ANALYSER")}
        </span>
      </header>

      <div class="analysis-matchup">
        <div class="analysis-team">
          <span class="analysis-team__role">Domicile</span>
          <strong>${safe(match.home || "Équipe domicile")}</strong>
        </div>
        <div class="analysis-vs" aria-label="contre"><span>VS</span></div>
        <div class="analysis-team analysis-team--away">
          <span class="analysis-team__role">Extérieur</span>
          <strong>${safe(match.away || "Équipe extérieure")}</strong>
        </div>
      </div>

      <div class="analysis-market">
        <span>Marché étudié</span>
        <strong>Match nul</strong>
      </div>

      <div class="analysis-kpis">
        ${renderKpi("Cote", formatOdds(match.odds), "Betclic")}
        ${renderKpi("Probabilité modèle", `${probability}%`, "Estimation SportLab")}
        ${renderKpi("Value", `${value}%`, valueTone(match.value))}
      </div>

      <div class="analysis-progress" aria-label="Probabilité modèle">
        <div class="analysis-progress__heading">
          <span>Probabilité de nul</span>
          <strong>${probability}%</strong>
        </div>
        <div class="analysis-progress__track">
          <span style="width:${clamp(probability, 0, 100)}%"></span>
        </div>
      </div>

      <footer class="analysis-card__footer">
        ${isValue ? renderBetForm(index) : renderNoBet()}
      </footer>
    </article>
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

function renderBetForm(index) {
  return `
    <div class="analysis-bet-panel">
      <label class="analysis-checkbox" for="draw-placed-${index}">
        <input type="checkbox" id="draw-placed-${index}">
        <span>
          <strong>Pari placé</strong>
          <small>Confirmer que le pari a été joué.</small>
        </span>
      </label>

      <label class="analysis-field" for="draw-stake-${index}">
        <span>Montant misé</span>
        <div class="analysis-field__control">
          <input id="draw-stake-${index}" type="number" min="0" step="0.01" inputmode="decimal" placeholder="Ex : 10">
          <span>€</span>
        </div>
      </label>

      <button type="button" class="analysis-button analysis-button--drawhunter" onclick="saveDrawHunterBet(${index})">
        <span>Valider le pari</span>
        <span aria-hidden="true">→</span>
      </button>
    </div>
  `;
}

function renderNoBet() {
  return `
    <div class="analysis-pass">
      <span class="analysis-pass__icon" aria-hidden="true">✓</span>
      <div>
        <strong>Aucun pari recommandé</strong>
        <p class="small">Statut : NON_PLACED</p>
      </div>
    </div>
  `;
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
  if (!value) return "-";
  try {
    return new Date(value).toLocaleString("fr-FR", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return safe(value);
  }
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
