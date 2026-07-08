/**
 * SPORTLAB V3
 * Journal des analyses
 */

export function renderJournal(analyses = []) {
  if (!analyses.length) {
    return `
        <h2>📒 Journal</h2>
        <p class="small">Aucune analyse sauvegardée.</p>
    `;
  }

  const sorted = [...analyses].sort(
    (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
  );

  return `
      <h2>📒 Journal</h2>

      ${sorted.map(renderAnalysis).join("")}
  `;
}

function renderAnalysis(a) {

  const badge =
    a.finalDecision === "VALUE"
      ? "badge-value"
      : "badge-no";

  return `
    <div class="journal-item">

      <p>
        ${sportIcon(a.sport)}
        <strong>${a.match}</strong>
      </p>

      <p class="small">
        ${a.market}
      </p>

      <span class="badge ${badge}">
        ${a.finalDecision || a.decision}
        ${a.scoreValue ? ` • ${a.scoreValue}%` : ""}
      </span>

      ${a.confidence ? `
        <p class="small">
          Confiance : ${a.confidence}%
        </p>
      ` : ""}

      <p class="small">
        ${formatDate(a.createdAt)}
      </p>

      <hr/>

    </div>
  `;
}

function sportIcon(sport) {

  if (sport === "rugby") return "🏉";
  if (sport === "football") return "⚽";

  return "🏟️";
}

function formatDate(timestamp) {

  if (!timestamp) return "-";

  return new Date(timestamp).toLocaleString("fr-FR");
}