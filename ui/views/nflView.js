// SPORTLAB V11.4.5 — NFL TOTALS PREMIUM UI
// Sprint 0.1 data route preserved; visual layer only.
// Refonte exclusivement visuelle : aucun moteur, calcul, workflow ou settlement n'est modifié.
import { renderTeamLogo } from "../../core/ui/teamBranding.js";
import { filterUnevaluatedMatches } from "../../core/performance/evaluatedMatchRegistry.js";

export function renderNfl(payload = {}) {
  const matches = filterUnevaluatedMatches("nfl", payload?.matches || []);
  const meta = payload?.meta || {};
  const diag = meta.historyDiagnostics || {};
  const ready = matches.filter(match => match?.predictionStatus === "OK").length;
  const avgConfidence = average(matches.filter(m => m?.predictionStatus === "OK").map(m => Number(m?.confidence) || 0));
  const over = matches.filter(m => m?.predictionStatus === "OK" && m?.recommendedTrend === "OVER").length;
  const under = matches.filter(m => m?.predictionStatus === "OK" && m?.recommendedTrend === "UNDER").length;

  return `<section class="nfl-premium sl-page" data-module="nfl">
    <header class="nfl-hero sl-panel">
      <div class="nfl-hero__glow" aria-hidden="true"></div>
      <div class="nfl-hero__identity">
        <span class="nfl-eyebrow">🏈 NFL TOTALS · SPORTLAB</span>
        <h1>Over / Under NFL</h1>
        <p>Modélisation des totaux, lecture de la tendance et validation de la VALUE Betclic.</p>
      </div>
      <div class="nfl-hero__session" aria-label="Session NFL">
        <span>Saison</span><strong>${safe(meta.season || "—")}</strong>
        <small>${matches.length} rencontre${matches.length > 1 ? "s" : ""} · ${ready} exploitable${ready > 1 ? "s" : ""}</small>
      </div>
    </header>

    <section class="nfl-kpi-rail" aria-label="Indicateurs NFL Totals">
      ${heroKpi("Rencontres", matches.length, meta.loading ? "chargement progressif" : "fenêtre d'analyse", "matches")}
      ${heroKpi("Modèles prêts", ready, `${num(diag.gamesLoaded)} matchs d'historique`, "ready")}
      ${heroKpi("Confiance", ready ? `${Math.round(avgConfidence)}%` : "—", "moyenne", "confidence")}
      ${heroKpi("Tendance", over === under ? "Équilibrée" : over > under ? "OVER" : "UNDER", `${over} over · ${under} under`, "trend")}
    </section>

    ${meta.error ? `<div class="nfl-alert sl-panel">⚠ <div><strong>Synchronisation NFL limitée</strong><p>${safe(meta.errorMessage)}</p></div></div>` : ""}

    <main class="nfl-workspace">
      <div class="nfl-workspace__heading">
        <div><span>TABLEAU DE DÉCISION</span><h2>Rencontres à analyser</h2></div>
        <p>La préconisation indique la direction du modèle. La VALUE n'est validée qu'après saisie de la ligne et de la cote Betclic.</p>
      </div>
      <div class="nfl-totals-grid">${matches.length
        ? matches.map((match, index) => renderGame(match, index)).join("")
        : `<article class="nfl-empty sl-panel"><span>🏈</span><h3>${meta.loading ? "Recherche des rencontres NFL…" : "Aucune rencontre NFL"}</h3><p>${meta.loading ? "Les matchs s'afficheront progressivement." : "Aucune rencontre n'est disponible dans la fenêtre d'analyse."}</p></article>`}
      </div>
    </main>
  </section>`;
}

function heroKpi(label, value, note, tone) {
  return `<article class="nfl-kpi nfl-kpi--${tone}"><span>${label}</span><strong>${value}</strong><small>${note}</small></article>`;
}

function renderGame(m, index) {
  const ok = m.predictionStatus === "OK";
  const trend=m.recommendedTrend==="UNDER"?"UNDER":"OVER";
  const trendArrow = trend === "OVER" ? "↗" : "↘";
  const confidence = Math.max(0, Math.min(100, Number(m.confidence) || 0));
  const total = Number(m.predictedTotalPoints) || 0;
  const reference = Number(m.historicalReferenceTotal) || 0;
  const delta = total - reference;
  const id = attr(m.id);

  return `<article class="nfl-match-card nfl-match-card--${ok ? trend.toLowerCase() : "pending"}" data-nfl-card data-match-id="${id}" style="--nfl-delay:${Math.min(index,8) * 45}ms">
    <div class="nfl-match-card__rail" aria-hidden="true"></div>
    <header class="nfl-match-card__header">
      <span class="nfl-competition">NFL · ${safe(m.stage || "Regular Season")}</span>
      <span class="nfl-week">${safe(m.week || "")}</span>
    </header>

    <section class="nfl-matchup" aria-label="${safe(m.away)} chez ${safe(m.home)}">
      <div class="nfl-team">
        ${renderTeamLogo({sport:"nfl",teamId:m.awayId,teamName:m.away,logo:m.awayLogo,className:"sl-team-logo nfl-team-logo"})}
        <strong>${safe(m.away)}</strong><small>EXTÉRIEUR</small>
      </div>
      <div class="nfl-matchup__center"><span>@</span><time>${date(m.date)}</time></div>
      <div class="nfl-team nfl-team--home">
        ${renderTeamLogo({sport:"nfl",teamId:m.homeId,teamName:m.home,logo:m.homeLogo,className:"sl-team-logo nfl-team-logo"})}
        <strong>${safe(m.home)}</strong><small>DOMICILE</small>
      </div>
    </section>

    ${ok ? `<section class="nfl-recommendation nfl-recommendation--${trend.toLowerCase()}">
      <div class="nfl-recommendation__top"><span>✦ Préconisation SportLab</span><b>Confiance ${num(confidence)}%</b></div>
      <div class="nfl-recommendation__main"><i>${trendArrow}</i><div><strong>${trend}</strong><p>Total modèle <b>${fmt(total)} pts</b> vs référence historique ${fmt(reference)} pts</p></div></div>
      <div class="nfl-recommendation__reason"><span>◎</span><p>${trend === "OVER" ? "Le modèle projette un total supérieur à la référence historique." : "Le modèle projette un total inférieur à la référence historique."} Écart : <strong>${signed(delta)} pts</strong>.</p></div>
    </section>

    <section class="nfl-model-kpis">
      ${metric("Total modèle", `${fmt(total)} pts`, "total")}
      ${metric("Sigma NFL", `${fmt(m.sigma)} pts`, "sigma")}
      ${metric("Intervalle (68%)", `${fmt(m.predictedRangeLow)} – ${fmt(m.predictedRangeHigh)}`, "range")}
      ${metric("Confiance", `${num(confidence)}%`, "confidence")}
    </section>

    <section class="nfl-projection-panel">
      <div class="nfl-projection-panel__heading"><span>PROJECTION</span><strong>${fmt(total)} pts</strong></div>
      <div class="nfl-projection-scale" aria-label="Intervalle probable ${fmt(m.predictedRangeLow)} à ${fmt(m.predictedRangeHigh)} points">
        <span>${fmt(m.predictedRangeLow)}</span><div><i style="left:50%"></i><b style="left:50%"></b></div><span>${fmt(m.predictedRangeHigh)}</span>
      </div>
      <div class="nfl-projection-split"><span>${safe(m.away)} <strong>${fmt(m.predictedAwayPoints)}</strong></span><i>+</i><span>${safe(m.home)} <strong>${fmt(m.predictedHomePoints)}</strong></span></div>
      <div class="nfl-confidence-meter"><div><span>Solidité de la projection</span><strong>${num(confidence)}%</strong></div><p><i style="width:${confidence}%"></i></p></div>
      <small class="nfl-history-note">Historique pondéré : ${num(m.awayHistory?.length)}/${num(m.homeHistory?.length)}</small>
    </section>

    <footer class="nfl-match-card__footer">
      <button class="sl-button sl-button-primary nfl-value-button" onclick="analyzeNflValue('${id}')"><span>▥</span> Analyser la VALUE</button>
      <div id="nfl-result-${id}" class="nfl-analysis-result"></div>
    </footer>` : `<section class="nfl-prediction-missing"><span>◌</span><div><strong>Historique insuffisant</strong><p>Projection en attente de données suffisantes (${num(m.awayHistory?.length)}/${num(m.homeHistory?.length)}).</p></div></section>`}
  </article>`;
}

function metric(label, value, tone) { return `<div class="nfl-model-kpi nfl-model-kpi--${tone}"><span>${label}</span><strong>${value}</strong></div>`; }
function average(values){ return values.length ? values.reduce((sum,v)=>sum+v,0)/values.length : 0; }
function signed(v){ const n=Number(v)||0; return `${n>=0?"+":""}${fmt(n)}`; }
function date(v){const d=new Date(v);return Number.isNaN(d.getTime())?safe(v||"—"):d.toLocaleString("fr-FR",{dateStyle:"medium",timeStyle:"short"});}
function fmt(v){const n=Number(v);return Number.isFinite(n)?n.toFixed(1).replace('.',','):"—";}
function num(v){return Number(v||0).toLocaleString("fr-FR");}
function safe(v){return String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");}
function attr(v){return safe(v);}
