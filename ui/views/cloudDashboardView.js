/**
 * SPORTLAB V7.1.2B — CLOUD DASHBOARD
 * Vue utilisateur du Sync Engine V2. Aucune logique métier.
 */
export function renderCloudDashboard({ cloud = {}, storageSummary = {}, recovery = {} } = {}) {
  const state = resolveState(cloud);
  const queue = cloud.queue || {};
  const diff = cloud.diff || {};

  return `
    <div class="cloud-dashboard sl-page sl-stack sl-stack-lg" data-cloud-state="${escapeAttribute(state.key)}">
      <section class="cloud-dashboard-hero sl-panel">
        <div>
          <p class="sl-label">Sync Engine V2</p>
          <h2>${state.icon} ${escapeHtml(state.label)}</h2>
          <p class="sl-muted">${escapeHtml(state.description)}</p>
        </div>
        <span class="sl-badge ${state.badgeClass}">${escapeHtml(state.shortLabel)}</span>
      </section>

      <section class="sl-kpi-grid cloud-dashboard-kpis">
        ${renderKpi("🕒", formatDate(cloud.lastSyncAt), "Dernière synchronisation")}
        ${renderKpi("⬆️", formatDate(cloud.lastPushAt), "Dernier envoi")}
        ${renderKpi("⬇️", formatDate(cloud.lastPullAt), "Dernière réception")}
        ${renderKpi("📦", formatInteger(cloud.queueSize), "Éléments en attente")}
      </section>

      <section class="cloud-dashboard-grid">
        <article class="sl-card cloud-dashboard-card">
          <header class="sl-section-header"><h3>☁️ État du cloud</h3></header>
          ${renderRow("Connexion", cloud.enabled && cloud.token ? "Connectée" : "Déconnectée")}
          ${renderRow("Réseau", cloud.online === false ? "Hors ligne" : "En ligne")}
          ${renderRow("Appareil", cloud.deviceId ? shortId(cloud.deviceId) : "Non enregistré")}
          ${renderRow("Dernière raison", humanReason(cloud.lastReason))}
          ${renderRow("Dernière tentative", formatDate(cloud.lastAttemptAt))}
        </article>

        <article class="sl-card cloud-dashboard-card">
          <header class="sl-section-header"><h3>📬 File Sync V2</h3></header>
          ${renderRow("Prêts", formatInteger(queue.ready))}
          ${renderRow("Différés", formatInteger(queue.delayed))}
          ${renderRow("Tentatives", formatInteger(queue.attempts ?? queue.totalAttempts))}
          ${renderRow("Push cumulés", formatInteger(cloud.totalPushes))}
          ${renderRow("Pull cumulés", formatInteger(cloud.totalPulls))}
          ${renderRow("Conflits cumulés", formatInteger(cloud.totalConflicts))}
          ${renderRow("Snapshots Recovery", formatInteger(recovery.snapshots?.length))}
        </article>

        <article class="sl-card cloud-dashboard-card">
          <header class="sl-section-header"><h3>🗂️ Données synchronisables</h3></header>
          ${renderRow("Analyses", formatInteger(storageSummary.analyses))}
          ${renderRow("Paris", formatInteger(storageSummary.bets))}
          ${renderRow("Workflows football", formatInteger(storageSummary.drawhunter))}
          ${renderRow("Workflows rugby", formatInteger(storageSummary.frenchflair))}
          ${renderRow("Enregistrements détectés", formatInteger(diff.records ?? diff.total ?? storageSummary.total))}
        </article>
      </section>

      ${cloud.lastError ? `<section class="sl-card cloud-dashboard-error"><h3>⚠️ Dernière erreur</h3><p>${escapeHtml(cloud.lastError)}</p><button type="button" class="sl-button" onclick="navigateSportLab('diagnostics')">Ouvrir les diagnostics</button></section>` : ""}

      <section class="sl-card cloud-dashboard-actions-panel">
        <div>
          <h3>Pilotage</h3>
          <p class="sl-muted">Les commandes agissent sur le Sync Engine V2 sans modifier les moteurs métier.</p>
        </div>
        <div class="cloud-dashboard-actions">
          <button type="button" class="sl-button sl-button-primary" onclick="runSportLabCloudSync()" ${cloud.syncing ? "disabled" : ""}>${cloud.syncing ? "Synchronisation…" : "Synchroniser maintenant"}</button>
          <button type="button" class="sl-button" onclick="openSportLabCloudSettings()">Paramètres cloud</button>
          <button type="button" class="sl-button" onclick="navigateSportLab('recovery')">Recovery Center</button>
          <button type="button" class="sl-button" onclick="navigateSportLab('diagnostics')">Diagnostics</button>
        </div>
      </section>
    </div>
  `;
}

function resolveState(cloud) {
  if (!cloud.enabled || !cloud.token) return { key: "disconnected", icon: "⚪", label: "Cloud déconnecté", shortLabel: "Déconnecté", description: "Connecte cet appareil pour activer la synchronisation multi-appareils.", badgeClass: "sl-badge-neutral" };
  if (cloud.online === false) return { key: "offline", icon: "🟠", label: "Mode hors ligne", shortLabel: "Hors ligne", description: "Les changements sont conservés dans la file locale et seront envoyés au retour du réseau.", badgeClass: "sl-badge-warning" };
  if (cloud.lastError) return { key: "error", icon: "🔴", label: "Synchronisation à vérifier", shortLabel: "Erreur", description: "Le cloud reste configuré, mais la dernière tentative a échoué.", badgeClass: "sl-badge-danger" };
  if (cloud.syncing) return { key: "syncing", icon: "🔄", label: "Synchronisation en cours", shortLabel: "En cours", description: "SportLab compare, envoie puis récupère les changements disponibles.", badgeClass: "sl-badge-info" };
  return { key: "synced", icon: "🟢", label: "Cloud opérationnel", shortLabel: "Synchronisé", description: "Le Sync Engine V2 est connecté et prêt à protéger les données SportLab.", badgeClass: "sl-badge-success" };
}
function renderKpi(icon, value, label) { return `<article class="sl-kpi-card"><span>${icon}</span><strong class="cloud-dashboard-kpi-value">${escapeHtml(value)}</strong><span class="sl-muted">${escapeHtml(label)}</span></article>`; }
function renderRow(label, value) { return `<div class="cloud-dashboard-row"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`; }
function formatDate(value) { const date = new Date(Number(value) || value); return value && !Number.isNaN(date.getTime()) ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(date) : "Jamais"; }
function formatInteger(value) { return new Intl.NumberFormat("fr-FR").format(Number(value || 0)); }
function shortId(value) { const text = String(value || ""); return text.length > 16 ? `${text.slice(0, 8)}…${text.slice(-6)}` : text; }
function humanReason(value) { return ({ manual: "Commande manuelle", startup: "Démarrage", connect: "Connexion", interval: "Contrôle périodique", change: "Modification locale", storage: "Modification autre onglet", online: "Retour du réseau", "queued-rerun": "Relance automatique" })[value] || "—"; }
function escapeHtml(value) { return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
function escapeAttribute(value) { return escapeHtml(value); }
