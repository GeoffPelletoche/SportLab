function n(value) {
  return Number(value || 0).toLocaleString("fr-FR");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function statusLabel(item) {
  if (item?.status === "OK") return "✅ Opérationnel";
  if (item?.status === "EMPTY") return "ℹ️ Aucun match sur la période";
  return "❌ Erreur";
}

function competitionDetails(log) {
  if (!log.length) {
    return `<p class="sl-muted">Aucun rapport de compétition disponible.</p>`;
  }

  return `
    <details class="diagnostic-competition-details" open>
      <summary>Détail par compétition</summary>
      <div class="sl-stack sl-stack-tight">
        ${log.map(item => `
          <article class="sl-card sl-card-compact">
            <strong>${escapeHtml(item.competition || `Ligue ${item.leagueId || "?"}`)}</strong>
            <p>${statusLabel(item)}</p>
            <p>Rencontres : <strong>${n(item.count)}</strong>${item.season ? ` · Saison ${escapeHtml(item.season)}` : ""}</p>
            ${item.httpStatus ? `<p>HTTP : <strong>${escapeHtml(item.httpStatus)}</strong></p>` : ""}
            ${item.code ? `<p>Code : <code>${escapeHtml(item.code)}</code></p>` : ""}
            ${item.detail ? `<p>${escapeHtml(item.detail)}</p>` : ""}
            ${item.message ? `<p class="sl-muted">${escapeHtml(item.message)}</p>` : ""}
          </article>
        `).join("")}
      </div>
    </details>
  `;
}

function moduleCard(label, meta = {}) {
  const log = Array.isArray(meta.syncLog) ? meta.syncLog : [];
  const h = meta.historyDiagnostics || {};
  const ok = log.filter(x => x.status === "OK").length;
  const empty = log.filter(x => x.status === "EMPTY").length;
  const errors = log.filter(x => x.status === "ERROR").length;

  return `
    <article class="sl-panel">
      <h2>${label}</h2>
      <p>Rencontres chargées : <strong>${n(meta.total)}</strong></p>
      <p>Compétitions opérationnelles : <strong>${ok}</strong></p>
      <p>Compétitions sans match : <strong>${empty}</strong></p>
      <p>Compétitions en erreur : <strong>${errors}</strong></p>
      <p>Historiques demandés : <strong>${n(h.requested)}</strong></p>
      <p>Historiques API valides : <strong>${n(h.apiSuccess)}</strong></p>
      <p>Reprises depuis le cache local : <strong>${n(h.cacheFallback)}</strong></p>
      <p>Réponses historiques vides : <strong>${n(h.emptyResponses)}</strong></p>
      <p>Erreurs historiques : <strong>${n(h.errors)}</strong></p>
      <p>Matchs historiques exploités : <strong>${n(h.gamesLoaded)}</strong></p>
      ${competitionDetails(log)}
    </article>
  `;
}

export function renderDiagnostics({
  settlement = null,
  drawhunterMeta = {},
  frenchflairMeta = {},
  learningDataset = [],
  learningSummary = {},
  calibration = {}
} = {}) {
  const evaluated = learningDataset.filter(item => item?.evaluatedAt).length;
  const pending = learningDataset.filter(item => !item?.evaluatedAt).length;
  const reports = Array.isArray(settlement?.reports) ? settlement.reports : [];

  return `
    <section class="diagnostics-page sl-page sl-stack">
      <header class="sl-panel">
        <span class="sl-label">SportLab V11.3</span>
        <h1>Diagnostics opérationnels</h1>
        <p>Chaque compétition est maintenant distinguée entre fonctionnement normal, période sans match et véritable erreur API.</p>
      </header>

      <div class="sl-grid sl-grid-2">
        ${moduleCard("⚽ DrawHunter", drawhunterMeta)}
        ${moduleCard("🏉 FrenchFlair", frenchflairMeta)}
      </div>

      <article class="sl-panel">
        <h2>Évaluation des prédictions</h2>
        <p>Snapshots enregistrés : <strong>${n(learningDataset.length)}</strong></p>
        <p>Prédictions évaluées : <strong>${n(evaluated)}</strong></p>
        <p>Prédictions en attente : <strong>${n(pending)}</strong></p>
        <p>Cette évaluation inclut les décisions NO VALUE et les rencontres sans pari placé.</p>
      </article>

      <article class="sl-panel">
        <h2>🧠 Passive Learning Engine</h2>
        <p>État : <strong>Actif — observation uniquement</strong></p>
        <p>Exemples enregistrés : <strong>${n(learningSummary.total)}</strong></p>
        <p>Exemples évalués : <strong>${n(learningSummary.evaluated)}</strong></p>
        <p>Précision des prédictions : <strong>${Number(learningSummary.predictionAccuracy || 0).toFixed(1)}%</strong></p>
        <p>Qualité des décisions : <strong>${Number(learningSummary.decisionAccuracy || 0).toFixed(1)}%</strong></p>
        <p>Niveau de maturité : <strong>${escapeHtml(learningSummary.maturity?.label || "Observation")}</strong></p>
        <p class="sl-muted">${escapeHtml(learningSummary.maturity?.message || "Le moteur collecte les résultats sans modifier les prédictions.")}</p>
        <p><strong>Aucun changement automatique du modèle n’est autorisé.</strong></p>
      </article>


      <article class="sl-panel">
        <h2>🎯 Calibration Engine</h2>
        <p>État : <strong>Actif — mesure passive</strong></p>
        <p>Observations exploitables : <strong>${n(calibration.observations)}</strong></p>
        <p>Calibration globale : <strong>${calibration.global?.count ? `${Number(calibration.global.score || 0).toFixed(1)}%` : "En attente"}</strong></p>
        <p>DrawHunter : <strong>${calibration.modules?.drawhunter?.count ? `${Number(calibration.modules.drawhunter.score || 0).toFixed(1)}%` : "En attente"}</strong></p>
        <p>FrenchFlair : <strong>${calibration.modules?.frenchflair?.count ? `${Number(calibration.modules.frenchflair.score || 0).toFixed(1)}%` : "En attente"}</strong></p>
        <p>Compétitions calibrées : <strong>${n(calibration.calibratedCompetitions)}</strong></p>
        <p>Dernière mise à jour : <strong>${calibration.lastUpdatedAt ? new Date(calibration.lastUpdatedAt).toLocaleString("fr-FR") : "Aucune évaluation"}</strong></p>
        <p class="sl-muted">Le moteur mesure l’écart entre probabilités annoncées et résultats observés sans modifier le modèle.</p>
      </article>

      <article class="sl-panel">
        <h2>Règlement des paris</h2>
        <p>Rapports : <strong>${n(reports.length)}</strong></p>
        <p>Paris réglés : <strong>${n(reports.filter(r => r?.status === "SETTLED").length)}</strong></p>
        <p>Erreurs : <strong>${n(reports.filter(r => r?.status === "ERROR").length)}</strong></p>
        <button type="button" id="run-settlement-diagnostic">🔄 Relancer le diagnostic</button>
      </article>
    </section>
  `;
}
