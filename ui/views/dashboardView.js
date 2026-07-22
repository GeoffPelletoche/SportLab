/**
 * SPORTLAB V6.3.7 — PACK 4
 * DASHBOARD PREMIUM V2
 *
 * Responsabilité :
 * - construire l’accueil Premium à partir des données préparées ;
 * - présenter les priorités, KPI, modules et synchronisations ;
 * - ne contenir aucune récupération de données ;
 * - ne modifier aucune logique métier.
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
  const content = renderActivePage({
    activePage,
    drawhunterHtml,
    frenchflairHtml,
    journalHtml,
    portfolioHtml,
    betsHtml,
    diagnosticsHtml,
    dashboard,
    drawhunterPayload,
    frenchflairPayload
  });

  return `
    ${navigationHtml}

    <main class="sl-main-content">
      ${content}
    </main>
  `;
}

function renderActivePage({
  activePage,
  drawhunterHtml,
  frenchflairHtml,
  journalHtml,
  portfolioHtml,
  betsHtml,
  diagnosticsHtml,
  dashboard,
  drawhunterPayload,
  frenchflairPayload
}) {
  switch (activePage) {
    case "drawhunter":
      return renderStandardPage("⚽", "DrawHunter", drawhunterHtml);

    case "frenchflair":
      return renderStandardPage("🏉", "FrenchFlair", frenchflairHtml);

    case "journal":
      return renderStandardPage("", "", journalHtml, true);

    case "bets":
      return renderStandardPage("", "", betsHtml, true);

    case "portfolio":
      return renderStandardPage("💼", "Portfolio", portfolioHtml);

    case "diagnostics":
      return renderStandardPage("🩺", "Diagnostics", diagnosticsHtml);

    case "home":
    default:
      return renderPremiumHome({
        dashboard,
        drawhunterPayload,
        frenchflairPayload
      });
  }
}

function renderStandardPage(icon, title, html, contentOnly = false) {
  return `
    <section class="card sl-card sl-page-section">
      ${contentOnly ? "" : `<h2>${icon} ${escapeHtml(title)}</h2>`}
      ${html}
    </section>
  `;
}

/* =========================================================
   ACCUEIL PREMIUM V2
========================================================= */

function renderPremiumHome({
  dashboard,
  drawhunterPayload,
  frenchflairPayload
}) {
  const bets = getSafeArray(dashboard?.bets);
  const drawhunterMatches = getSafeArray(drawhunterPayload?.matches);
  const frenchflairMatches = getSafeArray(frenchflairPayload?.matches);

  const drawhunterStats = buildModuleStats({
    source: "DrawHunter",
    matches: drawhunterMatches,
    bets
  });

  const frenchflairStats = buildModuleStats({
    source: "FrenchFlair",
    matches: frenchflairMatches,
    bets
  });

  const totals = {
    matches: drawhunterStats.matches + frenchflairStats.matches,
    value: drawhunterStats.value + frenchflairStats.value,
    placed: drawhunterStats.placed + frenchflairStats.placed,
    pending: toNumber(dashboard?.counters?.pending),
    settled: toNumber(dashboard?.counters?.settled)
  };

  const roi = toNumber(
    dashboard?.portfolio?.roi ??
    dashboard?.portfolio?.global?.roi
  );

  const latestSync = getLatestSyncDate([
    drawhunterPayload?.meta?.syncedAt,
    frenchflairPayload?.meta?.syncedAt
  ]);

  const syncErrors = [
    drawhunterPayload?.meta?.error === true,
    frenchflairPayload?.meta?.error === true
  ].filter(Boolean).length;

  return `
    <section
      class="premium-dashboard-v2 sl-page sl-stack sl-stack-lg"
      data-dashboard-premium
    >
      ${renderHero({
        totals,
        roi,
        latestSync,
        syncErrors,
        drawhunterStats,
        frenchflairStats
      })}

      ${renderPriorityStrip({
        totals,
        syncErrors,
        drawhunterStats,
        frenchflairStats
      })}

      <section class="dashboard-v2-workspace">
        <div class="dashboard-v2-main sl-stack sl-stack-lg">
          ${renderModuleSection({
            drawhunterStats,
            frenchflairStats,
            drawhunterPayload,
            frenchflairPayload
          })}

          ${renderOverview({ totals, roi })}
        </div>

        <aside class="dashboard-v2-sidebar sl-stack">
          ${renderQuickActions({ totals })}
          ${renderSyncPanel({
            drawhunterPayload,
            frenchflairPayload,
            latestSync
          })}
        </aside>
      </section>

      ${renderActivityPanel({ bets, totals })}
    </section>
  `;
}

/* =========================================================
   HERO
========================================================= */

function renderHero({
  totals,
  roi,
  latestSync,
  syncErrors,
  drawhunterStats,
  frenchflairStats
}) {
  const healthTone = syncErrors > 0 ? "warning" : "success";
  const healthLabel = syncErrors > 0
    ? "Synchronisation partielle"
    : "Système opérationnel";

  const analysisTarget = getSmartAnalysisTarget({
    drawhunterStats,
    frenchflairStats
  });

  const analysisLabel = getSmartAnalysisLabel({
    target: analysisTarget,
    drawhunterStats,
    frenchflairStats
  });

  return `
    <section class="dashboard-v2-hero sl-hero sl-panel">
      <div class="dashboard-v2-hero-copy">
        <span class="sl-label">SportLab Cockpit</span>

        <h1 class="sl-display dashboard-v2-title">
          Pilote tes analyses en un coup d’œil
        </h1>

        <p class="dashboard-v2-lead">
          ${buildHeroSentence(totals)}
        </p>

        <div class="dashboard-v2-hero-actions">
          <button
            type="button"
            class="sl-button sl-button-primary"
            data-dashboard-nav="${analysisTarget}"
            ${analysisTarget === "home" ? "disabled" : ""}
          >
            ${analysisLabel}
          </button>

          <button
            type="button"
            class="sl-button sl-button-ghost"
            data-dashboard-refresh
          >
            ↻ Actualiser
          </button>
        </div>

        <div class="dashboard-v2-hero-meta">
          <span class="sl-badge sl-badge-${healthTone}">
            ${syncErrors > 0 ? "⚠️" : "●"} ${healthLabel}
          </span>

          <span class="dashboard-v2-sync-date">
            Dernière mise à jour : <strong>${formatSyncDate(latestSync)}</strong>
          </span>
        </div>
      </div>

      <div class="dashboard-v2-scoreboard" aria-label="Résumé du tableau de bord">
        ${renderHeroMetric(totals.matches, "Matchs")}
        ${renderHeroMetric(totals.value, "VALUE", totals.value > 0 ? "sl-positive" : "")}
        ${renderHeroMetric(formatSignedPercent(roi), "ROI réglé", roiClass(roi))}
      </div>
    </section>
  `;
}

function renderHeroMetric(value, label, valueClass = "") {
  return `
    <article class="dashboard-v2-hero-metric">
      <strong class="${valueClass}">${escapeHtml(value)}</strong>
      <span>${escapeHtml(label)}</span>
    </article>
  `;
}

/* =========================================================
   PRIORITÉS
========================================================= */

function renderPriorityStrip({
  totals,
  syncErrors,
  drawhunterStats,
  frenchflairStats
}) {
  const items = [];

  if (totals.value > 0) {
    items.push({
      icon: "💎",
      title: `${formatInteger(totals.value)} opportunité${totals.value > 1 ? "s" : ""} VALUE`,
      text: "Priorité aux analyses dont l’edge dépasse le seuil.",
      tone: "success",
      page: drawhunterStats.value >= frenchflairStats.value
        ? "drawhunter"
        : "frenchflair"
    });
  }

  if (totals.matches > 0) {
    items.push({
      icon: "🏟️",
      title: `${formatInteger(totals.matches)} match${totals.matches > 1 ? "s" : ""} à traiter`,
      text: "Complète les informations Betclic manquantes.",
      tone: "info",
      page: drawhunterStats.matches >= frenchflairStats.matches
        ? "drawhunter"
        : "frenchflair"
    });
  }

  if (totals.pending > 0) {
    items.push({
      icon: "⏳",
      title: `${formatInteger(totals.pending)} pari${totals.pending > 1 ? "s" : ""} en attente`,
      text: "Le règlement automatique suivra les résultats.",
      tone: "neutral",
      page: "bets"
    });
  }

  if (syncErrors > 0) {
    items.push({
      icon: "⚠️",
      title: "Une source nécessite ton attention",
      text: "Consulte les diagnostics avant la prochaine analyse.",
      tone: "warning",
      page: "diagnostics"
    });
  }

  if (!items.length) {
    items.push({
      icon: "✅",
      title: "Tout est à jour",
      text: "Aucune action urgente n’est requise.",
      tone: "success",
      page: "home"
    });
  }

  return `
    <section class="dashboard-v2-priorities sl-section">
      <header class="sl-section-header">
        <div>
          <span class="sl-label">À faire maintenant</span>
          <h2 class="sl-section-title">Priorités</h2>
        </div>
      </header>

      <div class="dashboard-v2-priority-grid">
        ${items.slice(0, 3).map(renderPriorityCard).join("")}
      </div>
    </section>
  `;
}

function renderPriorityCard(item) {
  return `
    <button
      type="button"
      class="dashboard-v2-priority sl-card sl-card-interactive"
      data-dashboard-nav="${escapeAttribute(item.page)}"
    >
      <span class="dashboard-v2-priority-icon" aria-hidden="true">
        ${item.icon}
      </span>

      <span class="dashboard-v2-priority-content">
        <strong>${escapeHtml(item.title)}</strong>
        <span>${escapeHtml(item.text)}</span>
      </span>

      <span class="sl-badge sl-badge-${item.tone}">
        Ouvrir
      </span>
    </button>
  `;
}

/* =========================================================
   MODULES
========================================================= */

function renderModuleSection({
  drawhunterStats,
  frenchflairStats,
  drawhunterPayload,
  frenchflairPayload
}) {
  return `
    <section class="dashboard-v2-modules sl-section">
      <header class="sl-section-header">
        <div>
          <span class="sl-label">Moteurs d’analyse</span>
          <h2 class="sl-section-title">Modules</h2>
        </div>
      </header>

      <div class="sl-grid sl-grid-2">
        ${renderModuleCard({
          type: "drawhunter",
          icon: "⚽",
          title: "DrawHunter",
          description: "Analyse du match nul · Double chance si pertinente",
          stats: drawhunterStats,
          meta: drawhunterPayload?.meta,
          page: "drawhunter"
        })}

        ${renderModuleCard({
          type: "frenchflair",
          icon: "🏉",
          title: "FrenchFlair",
          description: "Totaux Over / Under rugby",
          stats: frenchflairStats,
          meta: frenchflairPayload?.meta,
          page: "frenchflair"
        })}
      </div>
    </section>
  `;
}

function renderModuleCard({
  type,
  icon,
  title,
  description,
  stats,
  meta,
  page
}) {
  const hasError = meta?.error === true;
  const hasValue = stats.value > 0;

  return `
    <article
      class="
        dashboard-v2-module sl-card
        dashboard-v2-module-${escapeAttribute(type)}
        ${hasValue ? "has-value" : ""}
        ${hasError ? "has-error" : ""}
      "
      data-module="${escapeAttribute(type)}"
    >
      <header class="sl-card-header">
        <div class="dashboard-v2-module-identity">
          <span class="dashboard-v2-module-icon">${icon}</span>

          <div>
            <h3 class="sl-card-title">${escapeHtml(title)}</h3>
            <p class="sl-card-description">${escapeHtml(description)}</p>
          </div>
        </div>

        <span class="sl-badge ${hasError ? "sl-badge-danger" : "sl-badge-success"}">
          ${hasError ? "Erreur" : "À jour"}
        </span>
      </header>

      <div class="dashboard-v2-module-focus">
        <strong class="${hasValue ? "sl-positive" : ""}">
          ${formatInteger(stats.value)}
        </strong>
        <span>opportunité${stats.value > 1 ? "s" : ""} VALUE</span>
      </div>

      <div class="dashboard-v2-module-stats">
        ${renderModuleStat(stats.matches, "À analyser")}
        ${renderModuleStat(stats.placed, "Paris placés")}
        ${renderModuleStat(formatSyncDate(meta?.syncedAt), "Synchronisé")}
      </div>

      <footer class="sl-card-footer">
        <span class="dashboard-v2-module-status">
          ${hasError
            ? "La dernière synchronisation a rencontré une erreur."
            : "Les données du module sont disponibles."}
        </span>

        <button
          type="button"
          class="sl-button sl-button-ghost sl-button-sm"
          data-dashboard-nav="${escapeAttribute(page)}"
        >
          Ouvrir →
        </button>
      </footer>
    </article>
  `;
}

function renderModuleStat(value, label) {
  return `
    <div class="dashboard-v2-module-stat">
      <strong>${escapeHtml(value)}</strong>
      <span>${escapeHtml(label)}</span>
    </div>
  `;
}

/* =========================================================
   VUE D’ENSEMBLE
========================================================= */

function renderOverview({ totals, roi }) {
  return `
    <section class="dashboard-v2-overview sl-section">
      <header class="sl-section-header">
        <div>
          <span class="sl-label">Performance</span>
          <h2 class="sl-section-title">Vue d’ensemble</h2>
        </div>

        <button
          type="button"
          class="sl-button sl-button-ghost sl-button-sm"
          data-dashboard-nav="portfolio"
        >
          Voir le portfolio
        </button>
      </header>

      <div class="sl-kpi-grid">
        ${renderKpi({
          icon: "🏟️",
          value: formatInteger(totals.matches),
          label: "Matchs disponibles",
          support: "Tous modules confondus"
        })}

        ${renderKpi({
          icon: "💎",
          value: formatInteger(totals.value),
          label: "VALUE détectées",
          support: totals.value > 0 ? "À examiner en priorité" : "Aucune actuellement",
          valueClass: totals.value > 0 ? "sl-positive" : ""
        })}

        ${renderKpi({
          icon: "🎯",
          value: formatInteger(totals.placed),
          label: "Paris placés",
          support: `${formatInteger(totals.pending)} en attente`
        })}

        ${renderKpi({
          icon: roi > 0 ? "📈" : roi < 0 ? "📉" : "➖",
          value: formatSignedPercent(roi),
          label: "ROI réglé",
          support: `${formatInteger(totals.settled)} pari${totals.settled > 1 ? "s" : ""} réglé${totals.settled > 1 ? "s" : ""}`,
          valueClass: roiClass(roi)
        })}
      </div>
    </section>
  `;
}

function renderKpi({
  icon,
  value,
  label,
  support,
  valueClass = ""
}) {
  return `
    <article class="sl-kpi-card dashboard-v2-kpi">
      <div class="sl-kpi-head">
        <span class="sl-kpi-icon">${icon}</span>
      </div>

      <div class="sl-kpi-main">
        <strong class="sl-kpi-value ${valueClass}">${escapeHtml(value)}</strong>
        <span class="sl-kpi-label">${escapeHtml(label)}</span>
      </div>

      <p class="sl-kpi-support">${escapeHtml(support)}</p>
    </article>
  `;
}

/* =========================================================
   ACTIONS RAPIDES
========================================================= */

function renderQuickActions({ totals }) {
  return `
    <section class="dashboard-v2-quick sl-panel">
      <header class="sl-card-header">
        <div>
          <span class="sl-label">Accès direct</span>
          <h2 class="sl-card-title">Actions rapides</h2>
        </div>
      </header>

      <div class="dashboard-v2-quick-list">
        ${renderQuickAction("⚽", "Analyser le football", "DrawHunter", "drawhunter")}
        ${renderQuickAction("🏉", "Analyser le rugby", "FrenchFlair", "frenchflair")}
        ${renderQuickAction("🎯", "Suivre mes paris", `${formatInteger(totals.pending)} en attente`, "bets")}
        ${renderQuickAction("📒", "Consulter le journal", "Historique complet", "journal")}
      </div>
    </section>
  `;
}

function renderQuickAction(icon, title, meta, page) {
  return `
    <button
      type="button"
      class="dashboard-v2-quick-action"
      data-dashboard-nav="${escapeAttribute(page)}"
    >
      <span class="dashboard-v2-quick-icon">${icon}</span>

      <span>
        <strong>${escapeHtml(title)}</strong>
        <small>${escapeHtml(meta)}</small>
      </span>

      <span aria-hidden="true">›</span>
    </button>
  `;
}

/* =========================================================
   SYNCHRONISATION
========================================================= */

function renderSyncPanel({
  drawhunterPayload,
  frenchflairPayload,
  latestSync
}) {
  return `
    <section class="dashboard-v2-sync sl-panel">
      <header class="sl-card-header">
        <div>
          <span class="sl-label">Données</span>
          <h2 class="sl-card-title">Synchronisation</h2>
        </div>

        <button
          type="button"
          class="sl-button sl-button-ghost sl-button-icon sl-button-sm"
          data-dashboard-refresh
          aria-label="Actualiser les données"
          title="Actualiser"
        >
          ↻
        </button>
      </header>

      <div class="dashboard-v2-sync-list">
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

      <p class="dashboard-v2-sync-foot">
        Dernière activité : ${formatSyncDate(latestSync)}
      </p>
    </section>
  `;
}

function renderSyncItem({ icon, label, meta }) {
  const hasError = meta?.error === true;

  return `
    <article class="dashboard-v2-sync-item">
      <span class="dashboard-v2-sync-icon">${icon}</span>

      <span class="dashboard-v2-sync-copy">
        <strong>${escapeHtml(label)}</strong>
        <small>${formatSyncDate(meta?.syncedAt)}</small>
      </span>

      <span class="dashboard-v2-status-dot ${hasError ? "is-error" : "is-success"}">
        <span class="sl-visually-hidden">
          ${hasError ? "Erreur" : "Opérationnel"}
        </span>
      </span>
    </article>
  `;
}

/* =========================================================
   ACTIVITÉ
========================================================= */

function renderActivityPanel({ bets, totals }) {
  const recentBets = [...bets]
    .sort((a, b) => getTimestamp(b) - getTimestamp(a))
    .slice(0, 4);

  return `
    <section class="dashboard-v2-activity sl-panel">
      <header class="sl-section-header">
        <div>
          <span class="sl-label">Suivi</span>
          <h2 class="sl-section-title">Activité récente</h2>
        </div>

        <button
          type="button"
          class="sl-button sl-button-ghost sl-button-sm"
          data-dashboard-nav="journal"
        >
          Ouvrir le journal
        </button>
      </header>

      ${
        recentBets.length
          ? `<div class="dashboard-v2-activity-list">${recentBets.map(renderActivityItem).join("")}</div>`
          : renderEmptyActivity(totals)
      }
    </section>
  `;
}

function renderActivityItem(bet) {
  const result = normalizeResult(bet?.result);
  const status = getBetStatus(result);
  const sourceIcon = normalizeText(bet?.source) === "frenchflair" ? "🏉" : "⚽";

  return `
    <article class="dashboard-v2-activity-item">
      <span class="dashboard-v2-activity-icon">${sourceIcon}</span>

      <span class="dashboard-v2-activity-copy">
        <strong>${escapeHtml(bet?.match || "Match non renseigné")}</strong>
        <small>
          ${escapeHtml(bet?.market || "Marché")}
          ${bet?.odds ? ` · cote ${escapeHtml(formatDecimal(bet.odds))}` : ""}
        </small>
      </span>

      <span class="sl-badge sl-badge-${status.tone}">
        ${status.label}
      </span>
    </article>
  `;
}

function renderEmptyActivity(totals) {
  return `
    <div class="sl-empty-state dashboard-v2-empty">
      <span class="sl-empty-state-icon">📭</span>
      <h3 class="sl-empty-state-title">Aucune activité récente</h3>
      <p class="sl-empty-state-text">
        ${totals.matches > 0
          ? "Analyse un match puis sauvegarde ton choix pour alimenter le journal."
          : "Les nouvelles activités apparaîtront ici."}
      </p>
    </div>
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
  const normalizedSource = normalizeText(source);

  const sourceBets = bets.filter(
    bet => normalizeText(bet?.source) === normalizedSource
  );

  const value = matches.filter(
    match => isValueDecision(
      match?.finalDecision ??
      match?.decision
    )
  ).length;

  const placed = sourceBets.filter(
    bet => bet?.placed === true
  ).length;

  return {
    matches: matches.length,
    value,
    placed
  };
}

function isValueDecision(value) {
  return ["VALUE", "VALUE BET", "BET"].includes(
    String(value || "").trim().toUpperCase()
  );
}

function buildHeroSentence(totals) {
  if (totals.matches <= 0) {
    return "Aucun match n’est disponible pour le moment. Tu peux vérifier la synchronisation ou consulter ton historique.";
  }

  if (totals.value > 0) {
    return `${formatInteger(totals.matches)} matchs sont disponibles, dont ${formatInteger(totals.value)} opportunité${totals.value > 1 ? "s" : ""} VALUE à examiner.`;
  }

  return `${formatInteger(totals.matches)} matchs sont disponibles. Aucune opportunité ne dépasse encore les seuils VALUE.`;
}

function getSmartAnalysisTarget({
  drawhunterStats,
  frenchflairStats
}) {
  if (drawhunterStats.value > 0 || frenchflairStats.value > 0) {
    return drawhunterStats.value >= frenchflairStats.value
      ? "drawhunter"
      : "frenchflair";
  }

  if (drawhunterStats.matches > 0 || frenchflairStats.matches > 0) {
    return drawhunterStats.matches >= frenchflairStats.matches
      ? "drawhunter"
      : "frenchflair";
  }

  return "home";
}

function getSmartAnalysisLabel({
  target,
  drawhunterStats,
  frenchflairStats
}) {
  if (target === "home") {
    return "✅ Aucune analyse en attente";
  }

  const targetStats =
    target === "drawhunter"
      ? drawhunterStats
      : frenchflairStats;

  const targetName =
    target === "drawhunter"
      ? "DrawHunter"
      : "FrenchFlair";

  if (targetStats.value > 0) {
    return `💎 Voir les opportunités ${targetName}`;
  }

  return `▶ Continuer dans ${targetName}`;
}

function getLatestSyncDate(values) {
  const validDates = values
    .map(value => new Date(value))
    .filter(date => !Number.isNaN(date.getTime()))
    .sort((a, b) => b.getTime() - a.getTime());

  return validDates[0] || null;
}

function formatSyncDate(value) {
  if (!value) {
    return "Non disponible";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Non disponible";
  }

  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatInteger(value) {
  return Math.max(0, Math.round(toNumber(value))).toLocaleString("fr-FR");
}

function formatSignedPercent(value) {
  const number = toNumber(value);
  const formatted = Math.abs(number).toLocaleString("fr-FR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  });

  if (number > 0) return `+${formatted} %`;
  if (number < 0) return `−${formatted} %`;
  return `${formatted} %`;
}

function formatDecimal(value) {
  return toNumber(value).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function roiClass(value) {
  const number = toNumber(value);
  if (number > 0) return "sl-positive";
  if (number < 0) return "sl-negative";
  return "";
}

function normalizeResult(value) {
  return String(value || "PENDING").trim().toUpperCase();
}

function getBetStatus(result) {
  const statuses = {
    WON: { label: "Gagné", tone: "success" },
    LOST: { label: "Perdu", tone: "danger" },
    PUSH: { label: "Push", tone: "neutral" },
    PENDING: { label: "En attente", tone: "warning" }
  };

  return statuses[result] || statuses.PENDING;
}

function getTimestamp(bet) {
  const value =
    bet?.updatedAt ??
    bet?.createdAt ??
    bet?.matchDate ??
    bet?.date;

  const timestamp = new Date(value || 0).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function getSafeArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
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
