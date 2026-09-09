// Sprint 0.1 data validation preserved; Sprint 0.2 activates NFL Totals.
import { renderTeamLogo } from "../../core/ui/teamBranding.js";

export function renderNfl(payload = {}) {
  const matches = Array.isArray(payload?.matches) ? payload.matches : [];
  const meta = payload?.meta || {};
  const diag = meta.historyDiagnostics || {};
  return `<section class="nfl-totals sl-page" data-module="nfl">
    <header class="sl-panel"><span class="sl-eyebrow">🏈 NFL · TOTALS</span><h1>Over / Under NFL</h1>
      <p>Total modèle NFL, sigma puis comparaison avec la ligne et la cote Betclic.</p>
      <p><strong>${matches.length}</strong> rencontre(s) · saison ${safe(meta.season||"—")} · historique ${num(diag.gamesLoaded)} matchs ${meta.loading ? "· chargement progressif…" : ""}</p></header>
    ${meta.error ? `<div class="sl-panel">⚠ ${safe(meta.errorMessage)}</div>` : ""}
    <div class="nfl-totals-grid">${matches.length ? matches.map(renderGame).join("") : `<article class="sl-card"><p>${meta.loading ? "Recherche des rencontres NFL…" : "Aucune rencontre NFL dans la fenêtre d’analyse."}</p></article>`}</div>
  </section>`;
}
function renderGame(m){
  const ok=m.predictionStatus==="OK";
  const trend=m.recommendedTrend==="UNDER"?"UNDER":"OVER";
  const trendArrow=trend==="OVER"?"↗":"↘";
  return `<article class="sl-card nfl-total-card nfl-total-card--${trend.toLowerCase()}" data-nfl-card data-match-id="${attr(m.id)}">
  <div class="nfl-data-teams"><span>${renderTeamLogo({sport:"nfl",teamId:m.awayId,teamName:m.away,logo:m.awayLogo,className:"sl-team-logo"})}<strong>${safe(m.away)}</strong></span><span>@</span><span>${renderTeamLogo({sport:"nfl",teamId:m.homeId,teamName:m.home,logo:m.homeLogo,className:"sl-team-logo"})}<strong>${safe(m.home)}</strong></span></div>
  <p>${date(m.date)} · ${safe(m.stage||"NFL")} ${m.week?`· ${safe(m.week)}`:""}</p>
  ${ok ? `<div class="nfl-recommendation nfl-recommendation--${trend.toLowerCase()}"><span>Préconisation SportLab</span><strong>${trendArrow} ${trend}</strong><small>Total modèle ${fmt(m.predictedTotalPoints)} pts · référence historique ${fmt(m.historicalReferenceTotal)} pts</small></div>
  <div class="nfl-model-kpis"><div><span>Total modèle</span><strong>${fmt(m.predictedTotalPoints)} pts</strong></div><div><span>Sigma NFL</span><strong>${fmt(m.sigma)} pts</strong></div><div><span>Intervalle</span><strong>${fmt(m.predictedRangeLow)}–${fmt(m.predictedRangeHigh)}</strong></div><div><span>Confiance</span><strong>${num(m.confidence)}%</strong></div></div>
  <p>Projection : ${safe(m.away)} ${fmt(m.predictedAwayPoints)} · ${safe(m.home)} ${fmt(m.predictedHomePoints)} · historique ${num(m.awayHistory?.length)}/${num(m.homeHistory?.length)}</p>
  <button class="sl-button sl-button-primary" onclick="analyzeNflValue('${attr(m.id)}')">Analyser la VALUE</button><div id="nfl-result-${attr(m.id)}"></div>` : `<p>Historique insuffisant (${num(m.awayHistory?.length)}/${num(m.homeHistory?.length)}).</p>`}
  </article>`; }
function date(v){const d=new Date(v);return Number.isNaN(d.getTime())?safe(v||"—"):d.toLocaleString("fr-FR",{dateStyle:"medium",timeStyle:"short"});}
function fmt(v){return Number(v||0).toFixed(1).replace('.',',');} function num(v){return Number(v||0).toLocaleString("fr-FR");}
function safe(v){return String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");} function attr(v){return safe(v);}
