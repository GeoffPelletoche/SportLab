import { syncConfigStore } from "./syncConfigStore.js";
function escapeHtml(v) { return String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c])); }
function formatTime(ts) { return ts ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(ts) : "Jamais"; }
export function createSyncPanel({ engine, eventBus, notifications }) {
  let status = "disconnected";
  function ensureButton() {
    let button = document.getElementById("sportlab-cloud-button");
    if (!button) { button = document.createElement("button"); button.id = "sportlab-cloud-button"; button.className = "sl-cloud-button"; button.type = "button"; button.addEventListener("click", open); document.body.appendChild(button); }
    renderButton(button); return button;
  }
  function resolveStatus(s = engine.getStatus()) {
    if (!s.enabled || !s.token) return "disconnected";
    if (s.online === false) return "offline";
    const code = String(s.lastErrorCode || "").toLowerCase();
    const hardFailure = code === "d1_daily_quota_exceeded"
      || code === "unauthorized" || code === "forbidden"
      || code === "401" || code === "403"
      || code.includes("auth") || code.includes("token");
    if (s.lastError && hardFailure) return "error";
    // V11.7.13 — « Synchronisation… » décrit uniquement une opération réellement
    // active. Une erreur réseau transitoire terminée ne doit pas laisser l'UI
    // bloquée dans cet état si une synchronisation réussie existe déjà.
    if (s.syncing) return "syncing";
    return s.lastSyncAt ? "synced" : (s.lastError ? "syncing" : "synced");
  }
  function renderButton(button = ensureButton()) { const s = engine.getStatus(); status = resolveStatus(s); const labels = { synced: "Cloud synchronisé", syncing: "Synchronisation…", offline: "Hors ligne", error: "Erreur Cloud", disconnected: "Cloud déconnecté" }; button.dataset.status = status; button.textContent = `☁️ ${labels[status] || labels.disconnected}`; button.title = `Dernière synchro : ${formatTime(s.lastSyncAt)}`; }
  function open() {
    const s = engine.getStatus(); let dialog = document.getElementById("sportlab-cloud-dialog"); if (!dialog) { dialog = document.createElement("dialog"); dialog.id = "sportlab-cloud-dialog"; dialog.className = "sl-cloud-dialog"; document.body.appendChild(dialog); }
    dialog.innerHTML = `<form method="dialog" class="sl-cloud-card"><div class="sl-cloud-head"><div><p class="sl-cloud-kicker">SportLab V7 Core</p><h2>Synchronisation Cloud</h2></div><button value="cancel" class="sl-cloud-close" aria-label="Fermer">×</button></div><div class="sl-cloud-state"><strong>${escapeHtml(status)}</strong><span>Dernière synchronisation : ${escapeHtml(formatTime(s.lastSyncAt))}</span><span>File hors ligne : ${s.queueSize} élément(s) · ${s.queue?.ready || 0} prêt(s) · ${s.queue?.delayed || 0} différé(s)</span><span>Dernier push : ${escapeHtml(formatTime(s.lastPushAt))} · dernier pull : ${escapeHtml(formatTime(s.lastPullAt))}</span></div><label>URL du Worker<input id="sl-cloud-endpoint" type="url" value="${escapeHtml(s.endpoint)}" autocomplete="url"></label><label>Jeton SportLab<input id="sl-cloud-token" type="password" value="${escapeHtml(s.token)}" autocomplete="current-password" placeholder="Jeton reçu au bootstrap"></label>${s.lastError ? `<p class="sl-cloud-error">${escapeHtml(s.lastError)}</p>` : ""}<div class="sl-cloud-actions"><button type="button" id="sl-cloud-connect" class="sl-button sl-button-primary">Connecter et synchroniser</button><button type="button" id="sl-cloud-now" class="sl-button">Synchroniser maintenant</button><button type="button" id="sl-cloud-disconnect" class="sl-button sl-button-danger">Déconnecter cet appareil</button></div><details><summary>Première installation</summary><p>Le jeton est créé une seule fois via <code>/v1/auth/bootstrap</code>. Conserve-le dans ton gestionnaire de mots de passe.</p></details></form>`;
    dialog.querySelector("#sl-cloud-connect").addEventListener("click", async () => { try { await engine.connect({ endpoint: dialog.querySelector("#sl-cloud-endpoint").value.trim(), token: dialog.querySelector("#sl-cloud-token").value.trim() }); dialog.close(); } catch {} });
    dialog.querySelector("#sl-cloud-now").addEventListener("click", () => engine.syncNow().then(() => dialog.close()).catch(() => {}));
    dialog.querySelector("#sl-cloud-disconnect").addEventListener("click", () => { engine.disconnect(); notifications.info("Cet appareil est déconnecté du cloud."); dialog.close(); });
    dialog.showModal();
  }
  eventBus.on("cloud:status", event => {
    // V11.7.11 — un échec isolé (4G/Safari, timeout, reprise automatique) n'est
    // pas une panne Cloud. Le rouge est réservé à un échec persistant / circuit
    // breaker. Une réussite ultérieure repasse immédiatement à « synchronisé ».
    if (event.status === "error") {
      const cfg = event.config || engine.getStatus();
      const code = String(cfg.lastErrorCode || event.code || "").toLowerCase();
      // V11.7.12 — un circuit breaker/retry reste un état de synchronisation,
      // pas une panne utilisateur. Le rouge est réservé aux erreurs qui exigent
      // réellement une action (authentification ou quota D1 explicite).
      const hardFailure = code === "d1_daily_quota_exceeded"
        || code === "unauthorized" || code === "forbidden"
        || code === "401" || code === "403"
        || code.includes("auth") || code.includes("token");
      status = hardFailure ? "error" : (engine.getStatus().syncing ? "syncing" : (engine.getStatus().lastSyncAt ? "synced" : "syncing"));
    } else {
      status = event.status;
    }
    ensureButton();
  });
  window.addEventListener("sportlab:cloud-config", () => renderButton());
  ensureButton(); return Object.freeze({ open, render: ensureButton });
}
