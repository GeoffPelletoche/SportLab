function formatDate(value) {
  if (!value) return "Jamais";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString("fr-FR");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function renderDiagnostics(diagnostic) {
  if (!diagnostic) {
    return `<div class="diagnostics-page sl-page sl-stack"><p>Aucun diagnostic disponible.</p></div>`;
  }

  const draw = diagnostic.modules?.drawhunter || {};
  const rugby = diagnostic.modules?.frenchflair || {};
  const settlement = diagnostic.settlement || null;

  return `
    <div class="diagnostics-page sl-page sl-stack">
      <section class="sl-panel">
        <h2>État réel des données</h2>
        <p>Contrôle effectué le <strong>${escapeHtml(formatDate(diagnostic.checkedAt))}</strong>.</p>
        <p>Réseau : <strong>${diagnostic.location?.online ? "En ligne" : "Hors ligne"}</strong></p>
      </section>

      ${renderModule("DrawHunter", draw)}
      ${renderModule("FrenchFlair", rugby)}

      <section class="sl-panel">
        <h2>Règlement des paris</h2>
        ${renderSettlement(settlement)}
        <button type="button" id="run-settlement-diagnostic">🔄 Contrôler le règlement</button>
      </section>

      <details class="sl-panel">
        <summary>Rapport technique complet</summary>
        <pre id="settlement-debug">${escapeHtml(JSON.stringify(diagnostic, null, 2))}</pre>
      </details>
    </div>
  `;
}

function renderModule(label, module) {
  const history = module.history || {};
  const healthy = !module.error && Number(module.syncErrors || 0) === 0;

  return `
    <section class="sl-panel diagnostics-module">
      <h2>${escapeHtml(label)}</h2>
      <p>Synchronisation : <strong>${healthy ? "Opérationnelle" : "Partielle"}</strong></p>
      <p>Dernière synchronisation : <strong>${escapeHtml(formatDate(module.syncedAt))}</strong></p>
      <p>Rencontres chargées : <strong>${Number(module.matches || 0)}</strong></p>
      <p>Analyses disponibles : <strong>${Number(module.analyzable || 0)}</strong></p>
      <p>Sans historique suffisant : <strong>${Number(module.withoutAnalysis || 0)}</strong></p>
      <p>Compétitions OK / erreurs : <strong>${Number(module.syncOk || 0)} / ${Number(module.syncErrors || 0)}</strong></p>
      <hr>
      <p>Historiques demandés : <strong>${Number(history.requested || 0)}</strong></p>
      <p>Historiques reçus par API : <strong>${Number(history.apiSuccess || 0)}</strong></p>
      <p>Reprises depuis le cache local : <strong>${Number(history.cacheFallback || 0)}</strong></p>
      <p>Historiques vides : <strong>${Number(history.empty || 0)}</strong></p>
      <p>Erreurs historiques : <strong>${Number(history.errors || 0)}</strong></p>
      <p>Matchs historiques exploités : <strong>${Number(history.matchesLoaded || 0)}</strong></p>
      ${module.errorMessage ? `<p class="sl-text-danger">${escapeHtml(module.errorMessage)}</p>` : ""}
    </section>
  `;
}

function renderSettlement(settlement) {
  if (!settlement) {
    return "<p>Aucun contrôle de règlement enregistré. Les compteurs restent naturellement à zéro tant qu’aucun pari n’est à régler.</p>";
  }

  const reports = Array.isArray(settlement.reports) ? settlement.reports : [];
  const betsBefore = Array.isArray(settlement.betsBefore) ? settlement.betsBefore : [];
  const settled = reports.filter(report => report?.status === "SETTLED").length;
  const errors = reports.filter(report => report?.status === "ERROR").length;

  return `
    <p>Paris contrôlés : <strong>${betsBefore.length}</strong></p>
    <p>Rapports : <strong>${reports.length}</strong></p>
    <p>Paris réglés : <strong>${settled}</strong></p>
    <p>Erreurs : <strong>${errors}</strong></p>
  `;
}
