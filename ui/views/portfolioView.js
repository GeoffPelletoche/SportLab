/** SPORTLAB V11.5.0 — PORTFOLIO DASHBOARD */
function toNumber(value) { const n = Number(value); return Number.isFinite(n) ? n : 0; }
function formatNumber(value, digits = 2) { return toNumber(value).toLocaleString("fr-FR", { minimumFractionDigits: digits, maximumFractionDigits: digits }); }
function formatMoney(value) { return `${formatNumber(value)} €`; }
function formatPercent(value) { const n=toNumber(value); return `${n>0?"+":""}${formatNumber(n)} %`; }
function perfClass(value) { return toNumber(value)>0?"stat-positive":toNumber(value)<0?"stat-negative":"stat-neutral"; }
function esc(value) { return String(value??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;"); }
function settings() { try { if (typeof localStorage === "undefined") return {}; return JSON.parse(localStorage.getItem("sportlab.v7.settings") || "{}"); } catch { return {}; } }

function kpi(label, value, cls="", icon="") { return `<article class="portfolio-pro-kpi"><div class="portfolio-pro-kpi-icon">${icon}</div><small>${esc(label)}</small><strong class="${cls}">${value}</strong></article>`; }

function pointsForPeriod(timeline, days) {
  const now=Date.now(), start=days ? now-days*86400000 : -Infinity;
  const prior=timeline.filter(x=>toNumber(x.timestamp)<start).reduce((s,x)=>s+toNumber(x.profit),0);
  const rows=timeline.filter(x=>toNumber(x.timestamp)>=start);
  let cumulative=prior;
  const pts=[];
  if (rows.length) pts.push({timestamp: Math.max(start===-Infinity?rows[0].timestamp:start, rows[0].timestamp-1), value:cumulative});
  rows.forEach(x=>{ cumulative+=toNumber(x.profit); pts.push({timestamp:toNumber(x.timestamp),value:cumulative}); });
  return pts;
}
function svgChart(points) {
  if (!points.length) return `<div class="portfolio-chart-empty">Les premiers résultats réglés alimenteront automatiquement la courbe.</div>`;
  const W=720,H=330,pad=38; const vals=points.map(p=>p.value); let min=Math.min(0,...vals),max=Math.max(0,...vals); if(max===min){max+=1;min-=1;} const t0=points[0].timestamp,t1=points.at(-1).timestamp||t0+1;
  const x=t=>pad+((t-t0)/Math.max(1,t1-t0))*(W-pad*2); const y=v=>H-pad-((v-min)/(max-min))*(H-pad*2);
  const poly=points.map(p=>`${x(p.timestamp).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
  const zero=y(0).toFixed(1); const last=points.at(-1).value;
  return `<svg class="portfolio-chart-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Évolution du profit cumulé"><line x1="${pad}" y1="${zero}" x2="${W-pad}" y2="${zero}" class="portfolio-zero"/><polyline points="${poly}" class="portfolio-line"/><circle cx="${x(points.at(-1).timestamp)}" cy="${y(last)}" r="6" class="portfolio-dot"/><text x="${W-pad}" y="${Math.max(22,y(last)-14)}" text-anchor="end" class="portfolio-chart-value">${last>=0?"+":""}${formatNumber(last)} €</text></svg>`;
}
function chartPanel(timeline, id, days) { return `<div class="portfolio-chart-panel portfolio-chart-${id}">${svgChart(pointsForPeriod(timeline,days))}</div>`; }

function renderStatisticsTable(title, rows) { const safe=Array.isArray(rows)?rows:[]; if(!safe.length)return `<section class="portfolio-breakdown sl-panel sl-section"><h3>${esc(title)}</h3><p class="small sl-muted">Aucune donnée disponible.</p></section>`; return `<section class="portfolio-breakdown sl-panel sl-section"><h3>${esc(title)}</h3><div class="table-scroll sl-table-wrap"><table class="portfolio-table sl-table"><thead><tr><th>Catégorie</th><th>Paris</th><th>Réglés</th><th>Gagnés</th><th>Perdus</th><th>Push</th><th>Mise</th><th>Profit</th><th>ROI</th></tr></thead><tbody>${safe.map(r=>`<tr><td><strong>${esc(r.label)}</strong></td><td>${toNumber(r.placedBets)}</td><td>${toNumber(r.settledBets)}</td><td>${toNumber(r.wins)}</td><td>${toNumber(r.losses)}</td><td>${toNumber(r.pushes)}</td><td>${formatMoney(r.invested)}</td><td class="${perfClass(r.profit)}">${formatMoney(r.profit)}</td><td class="${perfClass(r.roi)}">${formatPercent(r.roi)}</td></tr>`).join("")}</tbody></table></div></section>`; }

export function renderPortfolio({summary={},statistics={}}={}) {
  const global=statistics?.global||summary; const timeline=Array.isArray(statistics?.timeline)?statistics.timeline:[];
  const initialCapital=Math.max(toNumber(settings().portfolioInitialCapital)||100,1); const progression=toNumber(global.profit)/initialCapital*100; const currentCapital=initialCapital+toNumber(global.profit);
  return `<div class="portfolio-page portfolio-pro sl-page sl-stack sl-stack-lg">
    <section class="portfolio-pro-hero"><div><span class="portfolio-eyebrow">SPORTLAB · PORTFOLIO</span><h2>Performance financière</h2><p>Suivi réel des paris réglés et de l'évolution du capital.</p></div><div class="portfolio-bankroll"><small>Capital actuel</small><strong class="${perfClass(global.profit)}">${formatMoney(currentCapital)}</strong><span>Départ ${formatMoney(initialCapital)}</span></div></section>
    <section class="portfolio-chart-card"><div class="portfolio-chart-head"><div><span class="portfolio-eyebrow">COURBE DE PERFORMANCE</span><h3>Profit cumulé</h3></div><span class="${perfClass(global.profit)}">${formatMoney(global.profit)}</span></div>
      <input class="portfolio-period-radio" type="radio" name="portfolio-period" id="pf-7d"><input class="portfolio-period-radio" type="radio" name="portfolio-period" id="pf-30d" checked><input class="portfolio-period-radio" type="radio" name="portfolio-period" id="pf-90d"><input class="portfolio-period-radio" type="radio" name="portfolio-period" id="pf-1y"><input class="portfolio-period-radio" type="radio" name="portfolio-period" id="pf-all">
      <div class="portfolio-charts">${chartPanel(timeline,"7d",7)}${chartPanel(timeline,"30d",30)}${chartPanel(timeline,"90d",90)}${chartPanel(timeline,"1y",365)}${chartPanel(timeline,"all",null)}</div>
      <div class="portfolio-periods"><label for="pf-7d">7j</label><label for="pf-30d">30j</label><label for="pf-90d">3m</label><label for="pf-1y">1an</label><label for="pf-all">Tout</label></div>
    </section>
    <section class="portfolio-pro-grid">${kpi("Paris",toNumber(global.placedBets),"","◷")}${kpi("Profit net",formatMoney(global.profit),perfClass(global.profit),"€")}${kpi("ROI réel",formatPercent(global.roi),perfClass(global.roi),"↗")}${kpi("Progression",formatPercent(progression),perfClass(progression),"⌁")}</section>
    <section class="portfolio-capital-card"><div><strong>Capital de référence</strong><p>La progression correspond au profit net ÷ capital initial. Cette valeur est synchronisée avec les réglages SportLab.</p></div><div class="portfolio-capital-edit"><input id="portfolio-initial-capital" type="number" min="1" step="1" value="${initialCapital}"><span>€</span><button type="button" onclick="savePortfolioInitialCapital()">Enregistrer</button></div></section>
    <section class="portfolio-secondary-grid">${kpi("Paris réglés",toNumber(global.settledBets))}${kpi("En attente",toNumber(global.pending))}${kpi("Taux de réussite",formatPercent(global.winRate),perfClass(global.winRate-50))}${kpi("Mises réglées",formatMoney(global.invested))}</section>
    ${renderStatisticsTable("ROI par sport",statistics?.bySport)}${renderStatisticsTable("ROI par module",statistics?.bySource)}
    <details class="portfolio-details"><summary>Afficher le ROI par compétition</summary>${renderStatisticsTable("ROI par compétition",statistics?.byCompetition)}</details>
    <details class="portfolio-details"><summary>Afficher le ROI par marché</summary>${renderStatisticsTable("ROI par marché",statistics?.byMarket)}</details>
  </div>`;
}
