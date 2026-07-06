/**
 * SPORTLAB V3 — FRENCHFLAIR VIEW
 * Sprint 3.9A
 * Rôle :
 * afficher les matchs rugby sous forme de cartes professionnelles.
 */

export function renderFrenchFlair(payload) {
  const matches = sortByDate(payload?.matches || []);
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
      <p class="small">Dernière synchro : ${formatDateTime(meta.syncedAt)}</p>
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
        <p class="small">🏉 ${match.competition || "-"}</p>

        <div style="text-align:center; margin:16px 0;">
          <h3>${teamLabel(match.home)}</h3>
          <p class="small" style="margin:8px 0;">VS</p>
          <h3>${teamLabel(match.away)}</h3>
        </div>

        <p class="small">📅 ${formatDate(match.date)}</p>
        <p class="small">🕢 ${formatTime(match.date)}</p>

        <span class="badge badge-value">À analyser</span>

        <br/><br/>

        <button onclick="analyzeFrenchFlairValue(${index})">
          Analyser
        </button>

        <div id="ff-result-${index}" style="margin-top:12px;"></div>
      </div>
    `).join("")}
  `;
}

function teamLabel(name) {
  if (!name) return "Équipe inconnue";

  const flag = getFlag(name);

  return `${flag ? `${flag} ` : ""}${name}`;
}

function getFlag(name) {
  const normalized = name.toLowerCase();

  const flags = {
    "france": "🇫🇷",
    "la france": "🇫🇷",
    "nouvelle-zélande": "🇳🇿",
    "new zealand": "🇳🇿",
    "australie": "🇦🇺",
    "australia": "🇦🇺",
    "afrique du sud": "🇿🇦",
    "south africa": "🇿🇦",
    "angleterre": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    "england": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    "écosse": "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
    "l'écosse": "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
    "scotland": "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
    "pays de galles": "🏴󠁧󠁢󠁷󠁬󠁳󠁿",
    "wales": "🏴󠁧󠁢󠁷󠁬󠁳󠁿",
    "irlande": "🇮🇪",
    "ireland": "🇮🇪",
    "italie": "🇮🇹",
    "italy": "🇮🇹",
    "japon": "🇯🇵",
    "le japon": "🇯🇵",
    "japan": "🇯🇵",
    "fidji": "🇫🇯",
    "fiji": "🇫🇯",
    "argentine": "🇦🇷",
    "argentina": "🇦🇷"
  };

  return flags[normalized] || "";
}

function sortByDate(matches) {
  return [...matches].sort((a, b) => {
    return new Date(a.date || 0) - new Date(b.date || 0);
  });
}

function formatDate(value) {
  if (!value) return "-";

  try {
    return new Date(value).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric"
    });
  } catch {
    return value;
  }
}

function formatTime(value) {
  if (!value) return "-";

  try {
    return new Date(value).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short"
    });
  } catch {
    return value;
  }
}

function formatDateTime(value) {
  if (!value) return "-";

  try {
    return new Date(value).toLocaleString("fr-FR");
  } catch {
    return value;
  }
}