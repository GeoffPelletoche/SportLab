/**
 * SPORTLAB V6.2 — PORTFOLIO VIEW
 *
 * Affiche :
 * - les performances globales ;
 * - le ROI par sport ;
 * - le ROI par source ;
 * - le détail par compétition et marché.
 */

function toNumber(value) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
}

function formatNumber(value, digits = 2) {
  return toNumber(value)
    .toLocaleString(
      "fr-FR",
      {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits
      }
    );
}

function formatMoney(value) {
  return `${formatNumber(value)} €`;
}

function formatPercent(value) {
  const number =
    toNumber(value);

  const sign =
    number > 0
      ? "+"
      : "";

  return `${sign}${formatNumber(number)} %`;
}

function getPerformanceClass(value) {
  const number =
    toNumber(value);

  if (number > 0) {
    return "stat-positive";
  }

  if (number < 0) {
    return "stat-negative";
  }

  return "stat-neutral";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderSummaryCard(
  label,
  value,
  className = ""
) {
  return `
    <div class="portfolio-stat">
      <p class="small">
        ${escapeHtml(label)}
      </p>

      <h3 class="${className}">
        ${value}
      </h3>
    </div>
  `;
}

function renderStatisticsTable(
  title,
  rows
) {
  const safeRows =
    Array.isArray(rows)
      ? rows
      : [];

  if (safeRows.length === 0) {
    return `
      <section class="portfolio-breakdown">
        <h3>${escapeHtml(title)}</h3>

        <p class="small">
          Aucune donnée disponible.
        </p>
      </section>
    `;
  }

  return `
    <section class="portfolio-breakdown">
      <h3>${escapeHtml(title)}</h3>

      <div class="table-scroll">
        <table class="portfolio-table">
          <thead>
            <tr>
              <th>Catégorie</th>
              <th>Paris</th>
              <th>Réglés</th>
              <th>Gagnés</th>
              <th>Perdus</th>
              <th>Push</th>
              <th>Mise</th>
              <th>Profit</th>
              <th>ROI</th>
            </tr>
          </thead>

          <tbody>
            ${safeRows.map(row => `
              <tr>
                <td>
                  <strong>
                    ${escapeHtml(row.label)}
                  </strong>
                </td>

                <td>
                  ${toNumber(row.placedBets)}
                </td>

                <td>
                  ${toNumber(row.settledBets)}
                </td>

                <td>
                  ${toNumber(row.wins)}
                </td>

                <td>
                  ${toNumber(row.losses)}
                </td>

                <td>
                  ${toNumber(row.pushes)}
                </td>

                <td>
                  ${formatMoney(row.invested)}
                </td>

                <td class="${getPerformanceClass(
                  row.profit
                )}">
                  ${formatMoney(row.profit)}
                </td>

                <td class="${getPerformanceClass(
                  row.roi
                )}">
                  ${formatPercent(row.roi)}
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

export function renderPortfolio({
  summary = {},
  statistics = {}
} = {}) {
  const global =
    statistics?.global || summary;

  return `
    <div class="portfolio-page">

      <div class="grid portfolio-summary">
        ${renderSummaryCard(
          "Paris placés",
          toNumber(global.placedBets)
        )}

        ${renderSummaryCard(
          "Paris réglés",
          toNumber(global.settledBets)
        )}

        ${renderSummaryCard(
          "En attente",
          toNumber(global.pending)
        )}

        ${renderSummaryCard(
          "Gagnés",
          toNumber(global.wins)
        )}

        ${renderSummaryCard(
          "Perdus",
          toNumber(global.losses)
        )}

        ${renderSummaryCard(
          "Push",
          toNumber(global.pushes)
        )}

        ${renderSummaryCard(
          "Mise réglée",
          formatMoney(global.invested)
        )}

        ${renderSummaryCard(
          "Mise en attente",
          formatMoney(global.pendingStake)
        )}

        ${renderSummaryCard(
          "Profit net",
          formatMoney(global.profit),
          getPerformanceClass(global.profit)
        )}

        ${renderSummaryCard(
          "ROI",
          formatPercent(global.roi),
          getPerformanceClass(global.roi)
        )}

        ${renderSummaryCard(
          "Taux de réussite",
          formatPercent(global.winRate),
          getPerformanceClass(
            global.winRate - 50
          )
        )}
      </div>

      ${renderStatisticsTable(
        "ROI par sport",
        statistics?.bySport
      )}

      ${renderStatisticsTable(
        "ROI par module",
        statistics?.bySource
      )}

      <details class="portfolio-details">
        <summary>
          Afficher le ROI par compétition
        </summary>

        ${renderStatisticsTable(
          "ROI par compétition",
          statistics?.byCompetition
        )}
      </details>

      <details class="portfolio-details">
        <summary>
          Afficher le ROI par marché
        </summary>

        ${renderStatisticsTable(
          "ROI par marché",
          statistics?.byMarket
        )}
      </details>

    </div>
  `;
}