export function renderRecoveryCenter({ recovery = {}, cloud = {} } = {}) {
  const snapshots = recovery.snapshots || [];
  const conflicts = recovery.conflicts || [];
  const journal = recovery.journal || [];
  const preview = recovery.lastPreview?.comparison;
  return `
    <div class="recovery-center sl-stack-lg">
      <section class="sl-card recovery-hero">
        <div><p class="sl-eyebrow">Sprint 7.1.2C</p><h2>🛟 Cloud Recovery & Conflict Center</h2><p class="sl-muted">Compare, protège et restaure les données SportLab sans modifier les moteurs métier.</p></div>
        <span class="sl-badge ${cloud.enabled && cloud.token ? "sl-badge-success" : "sl-badge-neutral"}">${cloud.enabled && cloud.token ? "Cloud connecté" : "Cloud déconnecté"}</span>
      </section>

      <section class="recovery-actions-grid">
        ${actionCard("🔎", "Comparer Local / Cloud", "Prévisualise les différences sans modifier les données.", "previewSportLabRecovery()", "Comparer")}
        ${actionCard("⬇️", "Restaurer le Cloud", "Remplace les données locales après création d’un snapshot de sécurité.", "restoreSportLabCloudToLocal()", "Restaurer", true)}
        ${actionCard("⬆️", "Sauvegarder le Local", "Envoie volontairement l’état local vers le cloud.", "forceSportLabLocalToCloud()", "Sauvegarder", true)}
        ${actionCard("🔀", "Fusion intelligente", "Utilise la stratégie LWW du Sync Engine V2.", "mergeSportLabCloudData()", "Fusionner")}
        ${actionCard("🧹", "Nettoyer les anciens conflits", "Efface uniquement l’historique des conflits déjà résolus. Les analyses, paris et files de synchronisation sont conservés.", "clearSportLabResolvedConflicts()", "Nettoyer")}
      </section>

      ${preview ? renderPreview(preview) : `<section class="sl-card"><h3>Comparaison Local / Cloud</h3><p class="sl-muted">Aucune comparaison chargée. Utilise le bouton « Comparer » pour obtenir un aperçu actuel.</p></section>`}

      <section class="recovery-grid">
        <article class="sl-card"><header class="sl-section-header"><h3>📸 Snapshots locaux</h3><span class="sl-badge sl-badge-info">${snapshots.length}</span></header>${snapshots.length ? snapshots.slice(0, 8).map(renderSnapshot).join("") : empty("Aucun snapshot disponible.")}</article>
        <article class="sl-card"><header class="sl-section-header"><h3>⚖️ Conflits</h3><span class="sl-badge ${conflicts.length ? "sl-badge-warning" : "sl-badge-success"}">${conflicts.length}</span></header>${conflicts.length ? conflicts.slice(0, 8).map(renderConflict).join("") : empty("Aucun conflit enregistré.")}</article>
      </section>

      <section class="sl-card"><header class="sl-section-header"><h3>📜 Journal Recovery</h3><span class="sl-badge sl-badge-neutral">${journal.length}</span></header>${journal.length ? journal.slice(0, 12).map(renderJournal).join("") : empty("Aucune opération enregistrée.")}</section>
    </div>`;
}
function actionCard(icon,title,text,handler,label,danger=false){return `<article class="sl-card recovery-action-card"><span class="recovery-action-icon">${icon}</span><h3>${escapeHtml(title)}</h3><p class="sl-muted">${escapeHtml(text)}</p><button type="button" class="sl-button ${danger ? "sl-button-danger" : ""}" onclick="${handler}">${escapeHtml(label)}</button></article>`;}
function renderPreview(value){return `<section class="sl-card"><header class="sl-section-header"><h3>🔎 Comparaison Local / Cloud</h3><span class="sl-badge ${value.changed ? "sl-badge-warning" : "sl-badge-success"}">${value.changed} différence(s)</span></header><div class="recovery-compare"><div><strong>Local</strong>${summary(value.localSummary)}</div><div><strong>Cloud</strong>${summary(value.cloudSummary)}</div></div><div class="recovery-diff-list">${value.differences.filter(item=>item.status!=="identical").slice(0,12).map(item=>`<div class="recovery-row"><span>${escapeHtml(item.key)}</span><strong>${labelStatus(item.status)}</strong></div>`).join("") || empty("Les états sont identiques.")}</div></section>`;}
function summary(v={}){return `<dl><div><dt>Analyses</dt><dd>${num(v.analyses)}</dd></div><div><dt>Paris</dt><dd>${num(v.bets)}</dd></div><div><dt>Football</dt><dd>${num(v.drawhunter)}</dd></div><div><dt>Rugby</dt><dd>${num(v.frenchflair)}</dd></div></dl>`;}
function renderSnapshot(item){return `<div class="recovery-row recovery-snapshot"><div><strong>${date(item.createdAt)}</strong><small>${escapeHtml(item.reason)}</small></div><button type="button" class="sl-button" onclick="restoreSportLabSnapshot('${escapeAttribute(item.id)}')">Restaurer</button></div>`;}
function renderConflict(item){return `<div class="recovery-row"><div><strong>${escapeHtml(item.namespace)} · ${escapeHtml(item.key)}</strong><small>${date(item.at)}</small></div><span class="sl-badge sl-badge-neutral">${escapeHtml(item.winner === "server" ? "Cloud retenu" : item.winner === "client" ? "Local retenu" : "LWW")}</span></div>`;}
function renderJournal(item){return `<div class="recovery-row"><div><strong>${escapeHtml(item.message)}</strong><small>${date(item.at)}</small></div><span class="sl-badge sl-badge-neutral">${escapeHtml(item.type)}</span></div>`;}
function empty(text){return `<p class="sl-muted recovery-empty">${escapeHtml(text)}</p>`;} function num(v){return new Intl.NumberFormat("fr-FR").format(Number(v||0));} function date(v){const d=new Date(v);return Number.isNaN(d.getTime())?"—":new Intl.DateTimeFormat("fr-FR",{dateStyle:"short",timeStyle:"short"}).format(d);} function labelStatus(v){return ({"cloud-only":"Cloud uniquement","local-only":"Local uniquement","different":"Différent"})[v]||v;} function escapeHtml(v){return String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");} function escapeAttribute(v){return escapeHtml(v);}
