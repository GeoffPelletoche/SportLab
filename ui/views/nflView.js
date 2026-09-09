export function renderNfl(payload = {}) {
  const matches = Array.isArray(payload?.matches) ? payload.matches : [];
  const meta = payload?.meta || {};
  const diag = meta.historyDiagnostics || {};
  const status = meta.error ? `Erreur : ${escapeHtml(meta.errorMessage || "API NFL indisponible")}` : meta.loading ? "Chargement progressif…" : "Données prêtes";
  return `
    <section class="nfl-data sl-page" data-module="nfl">
      <div class="sl-panel">
        <h1>🏈 NFL Totals — Data Integration</h1>
        <p><strong>Sprint 0.1 :</strong> validation des matchs, équipes et historiques. Aucun calcul VALUE n'est encore activé.</p>
        <p><strong>État :</strong> ${status} · <strong>Saison :</strong> ${escapeHtml(meta.season || "—")} · <strong>Fenêtre :</strong> ${escapeHtml(meta.from || "—")} → ${escapeHtml(meta.to || "—")}</p>
        <p><strong>Historique :</strong> ${num(diag.gamesLoaded)} matchs chargés · ${num(diag.apiSuccess)} réponses API · ${num(diag.cacheFallback)} lectures cache · ${num(diag.errors)} erreur(s).</p>
      </div>
      <div class="nfl-data-grid">
        ${matches.length ? matches.map(renderGame).join("") : `<article class="sl-card"><p>${meta.loading ? "Recherche des rencontres NFL…" : "Aucune rencontre NFL dans la fenêtre d’analyse."}</p></article>`}
      </div>
    </section>`;
}
function renderGame(match) {
  return `<article class="sl-card nfl-data-card">
    <div class="nfl-data-teams">
      <span>${logo(match.awayLogo, match.away)} <strong>${escapeHtml(match.away)}</strong></span>
      <span>at</span>
      <span>${logo(match.homeLogo, match.home)} <strong>${escapeHtml(match.home)}</strong></span>
    </div>
    <p>${formatDate(match.date)} · ${escapeHtml(match.stage || "NFL")} ${match.week ? `· ${escapeHtml(match.week)}` : ""}</p>
    <p>Historique : ${num(match.awayHistory?.length)} / ${num(match.homeHistory?.length)} matchs</p>
  </article>`;
}
function logo(src,name){ return src ? `<img src="${escapeAttr(src)}" alt="" width="34" height="34" loading="lazy">` : "🏈"; }
function formatDate(v){ const d=new Date(v); return Number.isNaN(d.getTime())?escapeHtml(v||"—"):d.toLocaleString("fr-FR",{dateStyle:"medium",timeStyle:"short"}); }
function num(v){ return Number(v||0).toLocaleString("fr-FR"); }
function escapeHtml(v){ return String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;"); }
function escapeAttr(v){ return escapeHtml(v); }
