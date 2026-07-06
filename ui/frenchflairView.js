/**
 * SPORTLAB V3 — FRENCHFLAIR VIEW
 * Rôle :
 * afficher les matchs rugby + tendance Over/Under + état d'analyse.
 */

export function renderFrenchFlair(payload) {
  const matches = payload?.matches || [];
  const meta = payload?.meta || null;

  return `
    ${renderMeta(meta)}

    ${matches.length === 0 ? renderEmpty(meta) : renderMatches(matches)}
  `;
}

function renderMeta(meta) {
  if (!meta) {
    return `<p class="small">Synchronisation rugby non disponible.</p>`;
  }

  return `
    <div class="card">
      <p class="small">Période analysée : ${meta.from} → ${meta.to}</p>
      <p class="small">Compétitions actives : ${meta.competitions}</p>
      <p class="small">Matchs trouvés : ${meta.total}</p>
      <p class="small">Dernière synchro : ${formatDate(meta.syncedAt)}</p>
    </div>
  `;
}

function renderEmpty(meta) {
  return `
    <div class="card">
      <h3>Aucun match rugby trouvé</h3>
      <p class="small">
        Causes possibles : aucune rencontre sur la période, abonnement API expiré,
        quota atteint ou calendrier non encore disponible.
      </p>

      ${meta?.syncLog?.length ? `
        <h4>Détail synchronisation</h4>
        ${meta.syncLog.map(item => `
          <p class="small">
            ${item.competition} — ${item.status} — ${item.count} match(s)
            ${item.message ? `— ${item.message}` : ""}
          </p>
        `).join("")}
      ` : ""}
    </div>
  `;
}

function renderMatches(matches) {
  return `
    ${matches.map((match, index) => `
      <div class="card">
        <h3>${match.home || "Équipe domicile"} vs ${match.away || "Équipe extérieure"}</h3>
        <p class="small">${match.competition || "-"}</p>
        <p class="small">${formatDate(match.date)}</p>

        ${match.analysisStatus === "OK" ? renderAnalysis(match, index) : renderMissingStats(match)}
      </div>
    `).join("")}
  `;
}

function renderAnalysis(match, index) {
  return `
    <p>Tendance proposée : <strong>${match.trend}</strong></p>
    <p>Indice de confiance : ${match.confidence}%</p>
    <p>Total attendu : ${match.expectedTotalPoints} pts</p>
    <p class="small">${match.explanation}</p>

    <hr/>

    <label>
      Ligne bookmaker
      <input id="ff-line-${index}" type="number" step="0.5" placeholder="Ex : 48.5">
    </label>

    <label>
      Cote ${match.trend}
      <input id="ff-odds-${index}" type="number" step="0.01" placeholder="Ex : 1.90">
    </label>

    <button onclick="analyzeFrenchFlairValue(${index})">
      Analyser la value
    </button>

    <div id="ff-result-${index}" style="margin-top:12px;"></div>
  `;
}

function renderMissingStats(match) {
  return `
    <p><strong>Tendance indisponible</strong></p>
    <p class="small">${match.explanation || "Statistiques insuffisantes."}</p>

    <p class="small">
      Le match est bien récupéré, mais SportLab ne dispose pas encore de l’historique nécessaire
      pour proposer une tendance Over/Under fiable.
    </p>
  `;
}

function formatDate(value) {
  if (!value) return "-";

  try {
    return new Date(value).toLocaleString("fr-FR");
  } catch {
    return value;
  }
}