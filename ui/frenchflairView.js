/**
 * SPORTLAB V3 — FRENCHFLAIR VIEW
 * Sprint 4A.7
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
  if (!meta) return `<p class="small">Synchronisation rugby non disponible.</p>`;

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
      <p class="small">Aucune rencontre disponible sur la période analysée.</p>
    </div>
  `;
}

function renderMatches(matches) {
  return matches.map((match, index) => `
    <div class="card">
      <p class="small">🏉 ${match.competition || "-"}</p>

      <div style="text-align:center; margin:16px 0;">
        <h3>${teamLabel(match.home)}</h3>
        <p class="small">VS</p>
        <h3>${teamLabel(match.away)}</h3>
      </div>

      <p class="small">📅 ${formatDate(match.date)}</p>
      <p class="small">🕢 ${formatTime(match.date)}</p>

      ${renderPrediction(match)}

      <br/>

      <button onclick="analyzeFrenchFlairValue('${match.id}')">
        Analyser
      </button>

      <div id="ff-result-${index}" style="margin-top:12px;"></div>
    </div>
  `).join("");
}

function renderPrediction(match) {
  if (match.predictionStatus !== "OK") {
    return `
      <hr/>
      <p class="small">Prédiction indisponible</p>
    `;
  }

  return `
    <hr/>

    <p><strong>Points prédits</strong></p>
    <p class="small">${teamLabel(match.home)} : ${formatNumber(match.predictedHomePoints)} pts</p>
    <p class="small">${teamLabel(match.away)} : ${formatNumber(match.predictedAwayPoints)} pts</p>

    <p><strong>Total prédit : ${formatNumber(match.predictedTotalPoints)} pts</strong></p>
    <p class="small">
      Moyenne ± Sigma : ${formatNumber(match.predictedTotalPoints)} ± ${formatNumber(match.sigma)} pts
    </p>
    <p class="small">
      Zone probable : ${formatNumber(match.predictedRangeLow)} – ${formatNumber(match.predictedRangeHigh)} pts
    </p>

    <span class="badge ${confidenceClass(match.confidence)}">
  ${confidenceLabel(match.confidence)} — ${match.confidence}%
    </span>
  `;
}

function teamLabel(name) {
  if (!name) return "Équipe inconnue";
  const flag = getFlag(name);
  const translated = translateTeamName(name);
  return `${flag ? `${flag} ` : ""}${translated}`;
}

function translateTeamName(name) {
  const normalized = name.toLowerCase();

  const names = {
    "new zealand": "Nouvelle-Zélande",
    "italy": "Italie",
    "australia": "Australie",
    "france": "France",
    "la france": "France",
    "japan": "Japon",
    "le japon": "Japon",
    "ireland": "Irlande",
    "fiji": "Fidji",
    "england": "Angleterre",
    "south africa": "Afrique du Sud",
    "scotland": "Écosse",
    "l'écosse": "Écosse",
    "argentina": "Argentine",
    "wales": "Pays de Galles"
  };

  return names[normalized] || name;
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
    "argentina": "🇦🇷",
    "namibia": "🇳🇦",
    "namibie" : "🇳🇦"
  };

  return flags[normalized] || "";
}

function sortByDate(matches) {
  return [...matches].sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
}

function formatTime(value) {
  if (!value) return "-";
  return new Date(value).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short"
  });
}

function formatDateTime(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("fr-FR");
}

function formatNumber(value) {
  return Number(value || 0).toFixed(1);
}

function confidenceLabel(confidence) {
  if (confidence >= 80) return "Confiance forte";
  if (confidence >= 65) return "Confiance correcte";
  if (confidence >= 50) return "Confiance moyenne";
  return "Confiance faible";
}

function confidenceClass(confidence) {
  if (confidence >= 65) return "badge-value";
  if (confidence >= 50) return "badge-neutral";
  return "badge-no";
}
