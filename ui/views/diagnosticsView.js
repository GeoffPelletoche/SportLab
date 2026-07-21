/**
 * SPORTLAB V6.1 — DIAGNOSTICS VIEW
 */

function formatDate(value) {
  if (!value) {
    return "Jamais";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString("fr-FR");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function renderDiagnostics(diagnostic) {
  if (!diagnostic) {
    return `
      <div class="diagnostics-page">
        <p>
          Aucun diagnostic de règlement n’a encore été enregistré.
        </p>

        <button
          type="button"
          id="run-settlement-diagnostic"
        >
          🔄 Lancer le diagnostic
        </button>
      </div>
    `;
  }

  const betsBefore = Array.isArray(diagnostic.betsBefore)
    ? diagnostic.betsBefore
    : [];

  const betsAfter = Array.isArray(diagnostic.betsAfter)
    ? diagnostic.betsAfter
    : [];

  const reports = Array.isArray(diagnostic.reports)
    ? diagnostic.reports
    : [];

  const settledCount = reports.filter(
    report => report?.status === "SETTLED"
  ).length;

  const errorReports = reports.filter(
    report => report?.status === "ERROR"
  );

  const globalError =
    diagnostic.globalError ||
    diagnostic.error ||
    null;

  const displayMode =
    diagnostic.location?.displayMode || "inconnu";

  return `
    <div class="diagnostics-page">

      <p>
        Dernier contrôle :
        <strong>
          ${escapeHtml(formatDate(diagnostic.checkedAt))}
        </strong>
      </p>

      <p>
        Mode d’affichage :
        <strong>${escapeHtml(displayMode)}</strong>
      </p>

      <p>
        Paris avant contrôle :
        <strong>${betsBefore.length}</strong>
      </p>

      <p>
        Paris après contrôle :
        <strong>${betsAfter.length}</strong>
      </p>

      <p>
        Rapports générés :
        <strong>${reports.length}</strong>
      </p>

      <p>
        Paris réglés :
        <strong>${settledCount}</strong>
      </p>

      <p>
        Erreurs de règlement :
        <strong>${errorReports.length}</strong>
      </p>

      <p>
        Erreur globale :
        <strong>
          ${globalError ? escapeHtml(globalError) : "Aucune"}
        </strong>
      </p>

      <button
        type="button"
        id="run-settlement-diagnostic"
      >
        🔄 Relancer le diagnostic
      </button>

      <details style="margin-top: 16px;">
        <summary>Afficher le rapport technique</summary>

        <pre id="settlement-debug">${escapeHtml(
          JSON.stringify(diagnostic, null, 2)
        )}</pre>
      </details>

    </div>
  `;
}
