/**
 * SPORTLAB V3 — DRAWHUNTER VIEW
 * Rôle :
 * afficher les analyses DrawHunter + permettre la validation manuelle d’un pari VALUE.
 */

export function renderDrawHunter(payload) {
  const matches = payload?.matches || [];
  const meta = payload?.meta || null;

  return `
    ${renderMeta(meta)}

    ${matches.length === 0 ? renderEmpty(meta) : renderMatches(matches)}
  `;
}

function renderMeta(meta) {
  if (!meta) {
    return `<p class="small">Synchronisation non disponible.</p>`;
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
      <h3>Aucun match trouvé</h3>
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
        <h3>${match.home} vs ${match.away}</h3>
        <p class="small">${match.competition}</p>
        <p class="small">${formatDate(match.date)}</p>

        <p>Marché : <strong>DRAW</strong></p>
        <p>Cote : ${match.odds}</p>
        <p>Probabilité modèle : ${(match.probability * 100).toFixed(1)}%</p>
        <p>Value : ${(match.value * 100).toFixed(1)}%</p>

        <span class="badge ${match.decision === "VALUE BET" ? "badge-value" : "badge-no"}">
          ${match.decision}
        </span>

        ${match.decision === "VALUE BET" ? `
          <hr/>

          <label>
            <input type="checkbox" id="draw-placed-${index}">
            Pari placé
          </label>

          <br/><br/>

          <label>
            Montant misé
            <input id="draw-stake-${index}" type="number" min="0" step="0.01" placeholder="Ex : 10">
          </label>

          <br/><br/>

          <button onclick="saveDrawHunterBet(${index})">
            Valider le pari
          </button>
        ` : `
          <hr/>
          <p class="small">Statut : NON_PLACED</p>
        `}
      </div>
    `).join("")}
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