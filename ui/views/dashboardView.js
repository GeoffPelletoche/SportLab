/**
 * SPORTLAB V6.3.4 — DASHBOARD PREMIUM
 *
 * Responsabilité :
 * - afficher la page active ;
 * - construire l’accueil Premium à partir des données
 *   préparées par les services ;
 * - ne contenir aucune récupération de données.
 */

export function renderDashboard({
  activePage = "home",
  navigationHtml = "",

  drawhunterHtml = "",
  frenchflairHtml = "",
  journalHtml = "",
  portfolioHtml = "",
  betsHtml = "",
  diagnosticsHtml = "",

  dashboard = {},
  drawhunterPayload = {},
  frenchflairPayload = {}
}) {
  let content = "";

  switch (activePage) {
    case "drawhunter":
      content = `
        <section class="card sl-card sl-page-section">
          <h2>⚽ DrawHunter</h2>
          ${drawhunterHtml}
        </section>
      `;
      break;

    case "frenchflair":
      content = `
        <section class="card sl-card sl-page-section">
          <h2>🏉 FrenchFlair</h2>
          ${frenchflairHtml}
        </section>
      `;
      break;

    case "journal":
      content = `
        <section class="card sl-card sl-page-section">
          ${journalHtml}
        </section>
      `;
      break;

    case "bets":
      content = `
        <section class="card sl-card sl-page-section">
          ${betsHtml}
        </section>
      `;
      break;

    case "portfolio":
      content = `
        <section class="card sl-card sl-page-section">
          <h2>💼 Portfolio</h2>
          ${portfolioHtml}
        </section>
      `;
      break;

    case "diagnostics":
      content = `
        <section class="card sl-card sl-page-section">
          <h2>🩺 Diagnostics</h2>
          ${diagnosticsHtml}
        </section>
      `;
      break;

    case "home":
    default:
      content = renderPremiumHome({
        dashboard,
        drawhunterPayload,
        frenchflairPayload
      });
      break;
  }

  return `
    ${navigationHtml}

    <main class="sl-main-content">
      ${content}
    </main>
  `;
}

/* =========================================================
   ACCUEIL PREMIUM
   ========================================================= */

function renderPremiumHome({
  dashboard,
  drawhunterPayload,
  frenchflairPayload
}) {
  const drawhunterMatches =
    getSafeArray(drawhunterPayload?.matches);

  const frenchflairMatches =
    getSafeArray(frenchflairPayload?.matches);

  const bets =
    getSafeArray(dashboard?.bets);

  const drawhunterStats =
    buildModuleStats({
      source: "DrawHunter",
      matches: drawhunterMatches,
      bets
    });

  const frenchflairStats =
    buildModuleStats({
      source: "FrenchFlair",
      matches: frenchflairMatches,
      bets
    });

  const totalMatches =
    drawhunterStats.matches +
    frenchflairStats.matches;

  const totalValue =
    drawhunterStats.value +
    frenchflairStats.value;

  const totalPlaced =
    drawhunterStats.placed +
    frenchflairStats.placed;

  const portfolio =
    dashboard?.portfolio || {};

  const roi =
    toNumber(
      portfolio.roi ??
      portfolio.global?.roi
    );

  const latestSync =
    getLatestSyncDate([
      drawhunterPayload?.meta?.syncedAt,
      frenchflairPayload?.meta?.syncedAt
    ]);

  return `
    <section class="premium-dashboard sl-page sl-stack sl-stack-lg">

      ${renderHero({
        totalMatches,
        totalValue,
        latestSync
      })}

      <section class="premium-module-grid sl-grid sl-grid-2">

        ${renderModuleCard({
          type: "drawhunter",
          icon: "⚽",
          title: "DrawHunter",
          description: "Analyse du marché Match nul",
          stats: drawhunterStats,
          meta: drawhunterPayload?.meta,
          page: "drawhunter"
        })}

        ${renderModuleCard({
          type: "frenchflair",
          icon: "🏉",
          title: "FrenchFlair",
          description: "Analyse des totaux rugby",
          stats: frenchflairStats,
          meta: frenchflairPayload?.meta,
          page: "frenchflair"
        })}

      </section>

      ${renderDashboardKpis({
        totalMatches,
        totalValue,
        totalPlaced,
        roi
      })}

      ${renderAlerts({
        totalValue,
        totalMatches,
        drawhunterPayload,
        frenchflairPayload
      })}

      ${renderSyncPanel({
        drawhunterPayload,
        frenchflairPayload
      })}

    </section>
  `;
}

/* =========================================================
   HERO
   ========================================================= */

function renderHero({
  totalMatches,
  totalValue,
  latestSync
}) {
  return `
    <section class="premium-dashboard-hero sl-hero sl-panel">

      <div class="premium-dashboard-hero-content">

        <span class="premium-dashboard-eyebrow">
          Tableau de bord
        </span>

        <h2>
          Bonjour 👋
        </h2>

        <p>
          ${
            totalMatches > 0
              ? `
                ${formatInteger(totalMatches)}
                match${totalMatches > 1 ? "s" : ""}
                actuellement disponible${totalMatches > 1 ? "s" : ""}.
              `
              : `
                Aucun match disponible pour le moment.
              `
          }
        </p>

        <div class="premium-dashboard-hero-badges">

          <span class="sl-badge sl-badge-info">
            🏟️ ${formatInteger(totalMatches)} matchs
          </span>

          <span class="sl-badge ${
            totalValue > 0
              ? "sl-badge-success"
              : "sl-badge-neutral"
          }">
            💎 ${formatInteger(totalValue)} VALUE
          </span>

        </div>

      </div>

      <div class="premium-dashboard-sync">

        <span class="sl-label">
          Dernière synchronisation
        </span>

        <strong>
          ${formatSyncDate(latestSync)}
        </strong>

      </div>

    </section>
  `;
}

/* =========================================================
   CARTES MODULES
   ========================================================= */

function renderModuleCard({
  type,
  icon,
  title,
  description,
  stats,
  meta,
  page
}) {
  const hasValue =
    stats.value > 0;

  return `
    <button
      type="button"
      class="
        premium-module-card sl-card sl-module-card
        premium-module-${escapeAttribute(type)}
        ${hasValue ? "premium-module-has-value" : ""}
      "
      onclick="navigateSportLab('${escapeAttribute(page)}')"
    >

      <header class="premium-module-header">

        <span class="premium-module-icon">
          ${icon}
        </span>

        <div>
          <h3>
            ${escapeHtml(title)}
          </h3>

          <p>
            ${escapeHtml(description)}
          </p>
        </div>

        <span class="premium-module-arrow">
          ›
        </span>

      </header>

      <div class="premium-module-stats">

        ${renderModuleStat(
          stats.matches,
          "À analyser"
        )}

        ${renderModuleStat(
          stats.value,
          "VALUE",
          stats.value > 0
            ? "sl-positive"
            : ""
        )}

        ${renderModuleStat(
          stats.placed,
          "Paris placés"
        )}

      </div>

      <footer class="premium-module-footer">

        <span>
          ${renderModuleStatus(meta)}
        </span>

        <strong>
          Ouvrir
        </strong>

      </footer>

    </button>
  `;
}

function renderModuleStat(
  value,
  label,
  valueClass = ""
) {
  return `
    <div class="premium-module-stat">

      <strong class="${valueClass}">
        ${formatInteger(value)}
      </strong>

      <span>
        ${escapeHtml(label)}
      </span>

    </div>
  `;
}

/* =========================================================
   KPI
   ========================================================= */

function renderDashboardKpis({
  totalMatches,
  totalValue,
  totalPlaced,
  roi
}) {
  return `
    <section class="premium-dashboard-section sl-section">

      <header class="sl-section-header">
        <h2 class="sl-section-title">
          📊 Vue d’ensemble
        </h2>
      </header>

      <div class="sl-kpi-grid premium-dashboard-kpis">

        ${renderDashboardKpi({
          icon: "🏟️",
          value: totalMatches,
          label: "Matchs"
        })}

        ${renderDashboardKpi({
          icon: "💎",
          value: totalValue,
          label: "VALUE",
          valueClass:
            totalValue > 0
              ? "sl-positive"
              : ""
        })}

        ${renderDashboardKpi({
          icon: "🎯",
          value: totalPlaced,
          label: "Paris placés"
        })}

        ${renderDashboardKpi({
          icon:
            roi > 0
              ? "📈"
              : roi < 0
                ? "📉"
                : "➖",

          value:
            formatSignedPercent(roi),

          label:
            "ROI réglé",

          valueClass:
            roi > 0
              ? "sl-positive"
              : roi < 0
                ? "sl-negative"
                : ""
        })}

      </div>

    </section>
  `;
}

function renderDashboardKpi({
  icon,
  value,
  label,
  valueClass = ""
}) {
  return `
    <article class="sl-kpi-card premium-dashboard-kpi sl-kpi-card">

      <span class="premium-dashboard-kpi-icon">
        ${icon}
      </span>

      <strong class="sl-kpi-value ${valueClass}">
        ${escapeHtml(value)}
      </strong>

      <span class="sl-kpi-label">
        ${escapeHtml(label)}
      </span>

    </article>
  `;
}

/* =========================================================
   ALERTES
   ========================================================= */

function renderAlerts({
  totalValue,
  totalMatches,
  drawhunterPayload,
  frenchflairPayload
}) {
  const drawError =
    drawhunterPayload?.meta?.error === true;

  const rugbyError =
    frenchflairPayload?.meta?.error === true;

  return `
    <section class="sl-panel premium-alert-panel sl-panel">

      <header class="sl-section-header">
        <h2 class="sl-section-title">
          🔔 Alertes
        </h2>
      </header>

      <div class="premium-alert-list">

        ${renderAlert({
          icon:
            totalValue > 0
              ? "💎"
              : "✅",

          title:
            totalValue > 0
              ? `${formatInteger(totalValue)} opportunité${totalValue > 1 ? "s" : ""} VALUE`
              : "Aucune VALUE détectée",

          text:
            totalValue > 0
              ? "Des analyses intéressantes sont disponibles."
              : "Aucune opportunité ne dépasse actuellement les seuils.",

          css:
            totalValue > 0
              ? "premium-alert-success"
              : "premium-alert-neutral"
        })}

        ${renderAlert({
          icon: "🏟️",

          title:
            `${formatInteger(totalMatches)} match${totalMatches > 1 ? "s" : ""} disponible${totalMatches > 1 ? "s" : ""}`,

          text:
            "DrawHunter et FrenchFlair sont prêts pour l’analyse.",

          css:
            "premium-alert-info"
        })}

        ${renderAlert({
          icon:
            drawError || rugbyError
              ? "⚠️"
              : "☁️",

          title:
            drawError || rugbyError
              ? "Synchronisation partielle"
              : "Synchronisation opérationnelle",

          text:
            drawError || rugbyError
              ? "Au moins un module n’a pas pu charger ses données."
              : "Les services sportifs ont répondu normalement.",

          css:
            drawError || rugbyError
              ? "premium-alert-warning"
              : "premium-alert-success"
        })}

      </div>

    </section>
  `;
}

function renderAlert({
  icon,
  title,
  text,
  css
}) {
  return `
    <article class="premium-alert ${css}">

      <span class="premium-alert-icon">
        ${icon}
      </span>

      <div>
        <strong>
          ${escapeHtml(title)}
        </strong>

        <p>
          ${escapeHtml(text)}
        </p>
      </div>

    </article>
  `;
}

/* =========================================================
   SYNCHRONISATION
   ========================================================= */

function renderSyncPanel({
  drawhunterPayload,
  frenchflairPayload
}) {
  return `
    <section class="sl-panel premium-sync-panel sl-panel">

      <header class="sl-section-header">
        <h2 class="sl-section-title">
          ☁️ Synchronisation
        </h2>
      </header>

      <div class="premium-sync-grid">

        ${renderSyncItem({
          icon: "⚽",
          label: "Football",
          meta: drawhunterPayload?.meta
        })}

        ${renderSyncItem({
          icon: "🏉",
          label: "Rugby",
          meta: frenchflairPayload?.meta
        })}

      </div>

    </section>
  `;
}

function renderSyncItem({
  icon,
  label,
  meta
}) {
  const hasError =
    meta?.error === true;

  return `
    <article class="premium-sync-item sl-card sl-card-compact">

      <div class="premium-sync-title">

        <span>
          ${icon}
        </span>

        <strong>
          ${escapeHtml(label)}
        </strong>

      </div>

      <span class="
        sl-badge
        ${
          hasError
            ? "sl-badge-danger"
            : "sl-badge-success"
        }
      ">
        ${hasError ? "Erreur" : "Opérationnel"}
      </span>

      <p>
        ${formatSyncDate(meta?.syncedAt)}
      </p>

    </article>
  `;
}

/* =========================================================
   DONNÉES ET NORMALISATION
   ========================================================= */

function buildModuleStats({
  source,
  matches,
  bets
}) {
  const normalizedSource =
    normalizeText(source);

  const sourceBets =
    bets.filter(
      bet =>
        normalizeText(bet?.source) ===
        normalizedSource
    );

  const value =
    matches.filter(
      match =>
        isValueDecision(
          match?.finalDecision ??
          match?.decision
        )
    ).length;

  const placed =
    sourceBets.filter(
      bet => bet?.placed === true
    ).length;

  return {
    matches: matches.length,
    value,
    placed
  };
}

function isValueDecision(value) {
  const decision =
    String(value || "")
      .trim()
      .toUpperCase();

  return [
    "VALUE",
    "VALUE BET",
    "BET"
  ].includes(decision);
}

function renderModuleStatus(meta) {
  if (meta?.error === true) {
    return `
      <span class="sl-negative">
        ● Synchronisation en erreur
      </span>
    `;
  }

  return `
    <span class="sl-positive">
      ● Données à jour
    </span>
  `;
}

function getLatestSyncDate(values) {
  const validDates =
    values
      .map(value => new Date(value))
      .filter(
        date =>
          !Number.isNaN(
            date.getTime()
          )
      )
      .sort(
        (firstDate, secondDate) =>
          secondDate.getTime() -
          firstDate.getTime()
      );

  return validDates[0] || null;
}

function formatSyncDate(value) {
  if (!value) {
    return "Non disponible";
  }

  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Non disponible";
  }

  return date.toLocaleString(
    "fr-FR",
    {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    }
  );
}

function formatInteger(value) {
  return Math.max(
    0,
    Math.round(
      toNumber(value)
    )
  ).toLocaleString("fr-FR");
}

function formatSignedPercent(value) {
  const number =
    toNumber(value);

  const formatted =
    Math.abs(number)
      .toLocaleString(
        "fr-FR",
        {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1
        }
      );

  if (number > 0) {
    return `+${formatted} %`;
  }

  if (number < 0) {
    return `−${formatted} %`;
  }

  return `${formatted} %`;
}

function getSafeArray(value) {
  return Array.isArray(value)
    ? value
    : [];
}

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function toNumber(value) {
  const number =
    Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}