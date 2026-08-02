function n(value){ return Number(value || 0).toLocaleString("fr-FR"); }
function moduleCard(label, meta = {}) {
  const log = Array.isArray(meta.syncLog) ? meta.syncLog : [];
  const h = meta.historyDiagnostics || {};
  const ok = log.filter(x => x.status === "OK").length;
  const errors = log.filter(x => x.status === "ERROR").length;
  return `<article class="sl-panel"><h2>${label}</h2><p>Rencontres chargées : <strong>${n(meta.total)}</strong></p><p>Compétitions OK : <strong>${ok}</strong></p><p>Compétitions en erreur : <strong>${errors}</strong></p><p>Historiques demandés : <strong>${n(h.requested)}</strong></p><p>Historiques API valides : <strong>${n(h.apiSuccess)}</strong></p><p>Reprises depuis le cache local : <strong>${n(h.cacheFallback)}</strong></p><p>Réponses historiques vides : <strong>${n(h.emptyResponses)}</strong></p><p>Erreurs historiques : <strong>${n(h.errors)}</strong></p><p>Matchs historiques exploités : <strong>${n(h.gamesLoaded)}</strong></p></article>`;
}
export function renderDiagnostics({ settlement = null, drawhunterMeta = {}, frenchflairMeta = {}, learningDataset = [] } = {}) {
  const evaluated = learningDataset.filter(item => item?.evaluatedAt).length;
  const pending = learningDataset.filter(item => !item?.evaluatedAt).length;
  const reports = Array.isArray(settlement?.reports) ? settlement.reports : [];
  return `<section class="diagnostics-page sl-page sl-stack"><header class="sl-panel"><span class="sl-label">SportLab V10</span><h1>Diagnostics opérationnels</h1><p>Ces compteurs mesurent maintenant les flux API, les historiques et l’évaluation des modèles.</p></header><div class="sl-grid sl-grid-2">${moduleCard("⚽ DrawHunter", drawhunterMeta)}${moduleCard("🏉 FrenchFlair", frenchflairMeta)}</div><article class="sl-panel"><h2>Évaluation des prédictions</h2><p>Snapshots enregistrés : <strong>${n(learningDataset.length)}</strong></p><p>Prédictions évaluées : <strong>${n(evaluated)}</strong></p><p>Prédictions en attente : <strong>${n(pending)}</strong></p><p>Cette évaluation inclut les décisions NO VALUE et les rencontres sans pari placé.</p></article><article class="sl-panel"><h2>Règlement des paris</h2><p>Rapports : <strong>${n(reports.length)}</strong></p><p>Paris réglés : <strong>${n(reports.filter(r=>r?.status==="SETTLED").length)}</strong></p><p>Erreurs : <strong>${n(reports.filter(r=>r?.status==="ERROR").length)}</strong></p><button type="button" id="run-settlement-diagnostic">🔄 Relancer le diagnostic</button></article></section>`;
}
