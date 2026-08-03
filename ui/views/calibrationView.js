function n(value, digits = 0) {
  return Number(value || 0).toLocaleString("fr-FR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function gradeBadge(summary = {}) {
  return `<span class="calibration-grade calibration-grade-${escapeHtml(summary.tone || "neutral")}">${summary.icon || "⚪"} ${escapeHtml(summary.label || "En attente")}</span>`;
}

function summaryCard(title, summary = {}, icon = "📐") {
  return `
    <article class="calibration-summary-card sl-panel">
      <header>
        <span class="calibration-card-icon">${icon}</span>
        <div><small>${escapeHtml(title)}</small><strong>${summary.count ? `${n(summary.score, 1)}%` : "—"}</strong></div>
      </header>
      ${gradeBadge(summary)}
      <dl class="calibration-metrics">
        <div><dt>Observations</dt><dd>${n(summary.count)}</dd></div>
        <div><dt>Probabilité moyenne</dt><dd>${n(summary.meanPredicted, 1)}%</dd></div>
        <div><dt>Fréquence observée</dt><dd>${n(summary.observedRate, 1)}%</dd></div>
        <div><dt>Écart de calibration</dt><dd>${n(summary.expectedCalibrationError, 1)} pts</dd></div>
      </dl>
      ${summary.reliability === "LIMITED_SAMPLE" ? `<p class="sl-muted">Résultat indicatif : au moins 20 observations sont nécessaires pour une lecture fiable.</p>` : ""}
    </article>
  `;
}

function confidenceTable(bands = []) {
  const active = bands.filter(item => item.count > 0);
  if (!active.length) return `<p class="sl-muted">Aucune tranche disponible tant que les premières prédictions ne sont pas évaluées.</p>`;
  return `
    <div class="calibration-table-wrap">
      <table class="calibration-table">
        <thead><tr><th>Probabilité annoncée</th><th>Observations</th><th>Moyenne annoncée</th><th>Réussite réelle</th><th>Écart</th></tr></thead>
        <tbody>
          ${active.map(item => `
            <tr>
              <td>${item.min}–${item.max}%</td>
              <td>${n(item.count)}</td>
              <td>${n(item.meanPredicted, 1)}%</td>
              <td>${n(item.observedRate, 1)}%</td>
              <td class="${Math.abs(item.gap) <= 5 ? "calibration-gap-good" : "calibration-gap-watch"}">${item.gap > 0 ? "+" : ""}${n(item.gap, 1)} pts</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function competitionTable(competitions = []) {
  if (!competitions.length) return `<p class="sl-muted">Aucune compétition ne dispose encore d’une prédiction évaluée.</p>`;
  return `
    <div class="calibration-table-wrap">
      <table class="calibration-table">
        <thead><tr><th>Compétition</th><th>Observations</th><th>Calibration</th><th>État</th></tr></thead>
        <tbody>
          ${competitions.map(item => `
            <tr>
              <td>${escapeHtml(item.label)}</td>
              <td>${n(item.count)}</td>
              <td>${item.count ? `${n(item.score, 1)}%` : "—"}</td>
              <td>${gradeBadge(item)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

export function renderCalibration(calibration = {}) {
  const global = calibration.global || {};
  const drawhunter = calibration.modules?.drawhunter || {};
  const frenchflair = calibration.modules?.frenchflair || {};
  const updated = calibration.lastUpdatedAt
    ? new Date(calibration.lastUpdatedAt).toLocaleString("fr-FR")
    : "Aucune évaluation";

  return `
    <section class="calibration-page sl-page sl-stack sl-stack-lg">
      <header class="calibration-hero sl-panel">
        <div>
          <span class="sl-label">SportLab V11.3</span>
          <h1>Calibration Engine</h1>
          <p>Mesure passive de l’écart entre les probabilités annoncées et les résultats réellement observés. Le moteur ne modifie aucune prédiction.</p>
        </div>
        <div class="calibration-hero-meta">
          <small>Dernière mise à jour</small>
          <strong>${escapeHtml(updated)}</strong>
          <span>${n(calibration.observations)} observation(s) exploitable(s)</span>
        </div>
      </header>

      <div class="calibration-summary-grid">
        ${summaryCard("Calibration globale", global, "🎯")}
        ${summaryCard("DrawHunter", drawhunter, "⚽")}
        ${summaryCard("FrenchFlair", frenchflair, "🏉")}
      </div>

      <article class="sl-panel">
        <header class="calibration-section-title"><div><span>📊</span><div><h2>Calibration par tranche de probabilité</h2><p>Une tranche est bien calibrée lorsque sa fréquence observée est proche de sa probabilité moyenne annoncée.</p></div></div></header>
        ${confidenceTable(calibration.confidenceBands || [])}
      </article>

      <article class="sl-panel">
        <header class="calibration-section-title"><div><span>🏆</span><div><h2>Calibration par compétition</h2><p>${n(calibration.calibratedCompetitions)} compétition(s) disposent d’au moins 10 observations.</p></div></div></header>
        ${competitionTable(calibration.competitions || [])}
      </article>

      <article class="sl-panel calibration-method-note">
        <strong>Lecture de l’indice</strong>
        <p>L’indice correspond à 100 moins l’erreur de calibration pondérée. Seuils : excellente ≥ 92%, très bonne ≥ 88%, correcte ≥ 80%, à surveiller ≥ 70%, faible en dessous de 70%.</p>
        <p><strong>Le Calibration Engine reste strictement passif :</strong> aucune probabilité, aucun seuil et aucune décision ne sont recalculés automatiquement.</p>
      </article>
    </section>
  `;
}
