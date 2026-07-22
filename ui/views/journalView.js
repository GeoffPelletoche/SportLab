// ui/views/journalView.js

/**
 * SPORTLAB V6.3.2.2
 *
 * JOURNAL PREMIUM
 *
 * Responsabilité :
 * afficher les données préparées par journalService.
 */

export function renderJournal(journal = {}) {
    const {
        entries = [],
        options = {},
        filters = {},
        summary = {},
        totalEntries = 0,
        filteredEntries = 0
    } = journal;

    return `
        <section class="journal-page">

            ${renderJournalHeader(
                totalEntries
            )}

            ${renderJournalKpis(
                summary
            )}

            ${renderFinancialSummary(
                summary
            )}

            ${renderResultSummary(
                summary
            )}

            ${renderFilters({
                options,
                filters,
                filteredEntries,
                totalEntries
            })}

            <section class="journal-list">

                ${
                    entries.length === 0
                        ? renderEmptyState()
                        : entries
                            .map(renderJournalCard)
                            .join("")
                }

            </section>

        </section>
    `;
}

/* =========================================================
   EN-TÊTE
   ========================================================= */

function renderJournalHeader(totalEntries) {
    return `
        <header class="sl-page-header">

            <div class="sl-page-header-content">

                <h2 class="sl-page-title">
                    📒 Journal
                </h2>

                <p>
                    Suivi centralisé des analyses et paris SportLab.
                </p>

            </div>

            <span class="sl-badge sl-badge-info">

                ${formatInteger(totalEntries)}
                entrée${totalEntries > 1 ? "s" : ""}

            </span>

        </header>
    `;
}

/* =========================================================
   KPI PRINCIPAUX
   ========================================================= */

function renderJournalKpis(summary) {
    return `
        <section
            class="sl-kpi-grid journal-kpi-grid"
            aria-label="Résumé du Journal"
        >

            ${renderKpi({
                icon: "📊",
                value:
                    summary.totalAnalyses,
                label:
                    "Analyses"
            })}

            ${renderKpi({
                icon: "💎",
                value:
                    summary.valueAnalyses,
                label:
                    "VALUE"
            })}

            ${renderKpi({
                icon: "🎯",
                value:
                    summary.placedBets,
                label:
                    "Paris placés"
            })}

            ${renderKpi({
                icon:
                    getRoiIcon(
                        summary.roi
                    ),

                value:
                    formatSignedPercent(
                        summary.roi
                    ),

                label:
                    "ROI réglé",

                valueClass:
                    getNumberClass(
                        summary.roi
                    )
            })}

        </section>
    `;
}

function renderKpi({
    icon,
    value,
    label,
    valueClass = ""
}) {
    return `
        <article class="sl-kpi-card">

            <span
                class="journal-kpi-icon"
                aria-hidden="true"
            >
                ${icon}
            </span>

            <strong
                class="sl-kpi-value ${valueClass}"
            >
                ${escapeHtml(
                    value ?? 0
                )}
            </strong>

            <span class="sl-kpi-label">
                ${escapeHtml(label)}
            </span>

        </article>
    `;
}

/* =========================================================
   RÉSUMÉ FINANCIER
   ========================================================= */

function renderFinancialSummary(summary) {
    const profit =
        toNumber(summary.profit);

    const roi =
        toNumber(summary.roi);

    return `
        <section class="sl-panel journal-summary-panel">

            <div class="sl-section-header">

                <h3 class="sl-section-title">
                    💰 Résumé financier
                </h3>

                <span
                    class="
                        sl-badge
                        ${getFinancialBadgeClass(roi)}
                    "
                >
                    ROI
                    ${formatSignedPercent(roi)}
                </span>

            </div>

            <div class="journal-financial-grid">

                ${renderFinancialItem(
                    "Mises réglées",
                    formatCurrency(
                        summary.invested
                    )
                )}

                ${renderFinancialItem(
                    "Mises en attente",
                    formatCurrency(
                        summary.pendingStake
                    )
                )}

                ${renderFinancialItem(
                    "Profit net",
                    formatSignedCurrency(
                        profit
                    ),
                    getNumberClass(profit)
                )}

                ${renderFinancialItem(
                    "Paris réglés",
                    formatInteger(
                        summary.settledBets
                    )
                )}

            </div>

        </section>
    `;
}

function renderFinancialItem(
    label,
    value,
    valueClass = ""
) {
    return `
        <div class="journal-financial-item">

            <span class="sl-label">
                ${escapeHtml(label)}
            </span>

            <strong
                class="sl-value ${valueClass}"
            >
                ${escapeHtml(value)}
            </strong>

        </div>
    `;
}

/* =========================================================
   RÉSULTATS
   ========================================================= */

function renderResultSummary(summary) {
    return `
        <section class="journal-result-summary">

            ${renderResultBadge(
                "✅",
                summary.wins,
                "WON",
                "sl-badge-success"
            )}

            ${renderResultBadge(
                "❌",
                summary.losses,
                "LOST",
                "sl-badge-danger"
            )}

            ${renderResultBadge(
                "↔️",
                summary.pushes,
                "PUSH",
                "sl-badge-info"
            )}

            ${renderResultBadge(
                "⏳",
                summary.pending,
                "PENDING",
                "sl-badge-warning"
            )}

        </section>
    `;
}

function renderResultBadge(
    icon,
    count,
    label,
    cssClass
) {
    return `
        <span class="sl-badge ${cssClass}">

            ${icon}
            ${formatInteger(count)}
            ${label}

        </span>
    `;
}

/* =========================================================
   FILTRES
   ========================================================= */

function renderFilters({
    options,
    filters,
    filteredEntries,
    totalEntries
}) {
    return `
        <section class="sl-panel journal-filter-panel">

            <div class="sl-section-header">

                <h3 class="sl-section-title">
                    🔎 Recherche et filtres
                </h3>

                <span class="sl-muted">
                    ${formatInteger(filteredEntries)}
                    sur
                    ${formatInteger(totalEntries)}
                </span>

            </div>

            <input
                id="journal-search"
                class="sl-input journal-search"
                type="search"
                value="${escapeAttribute(
                    filters.search
                )}"
                placeholder="Match, compétition, marché..."
                autocomplete="off"
            >

            <div class="sl-filter-grid">

                ${renderSelect({
                    id: "filter-sport",
                    label: "Tous les sports",
                    values:
                        options.sports,
                    selected:
                        filters.sport
                })}

                ${renderSelect({
                    id: "filter-source",
                    label: "Tous les modules",
                    values:
                        options.sources,
                    selected:
                        filters.source
                })}

                ${renderSelect({
                    id: "filter-competition",
                    label: "Toutes les compétitions",
                    values:
                        options.competitions,
                    selected:
                        filters.competition
                })}

                ${renderSelect({
                    id: "filter-market",
                    label: "Tous les marchés",
                    values:
                        options.markets,
                    selected:
                        filters.market
                })}

                ${renderSelect({
                    id: "filter-decision",
                    label: "Toutes les décisions",
                    values:
                        options.decisions,
                    selected:
                        filters.decision
                })}

                ${renderSelect({
                    id: "filter-result",
                    label: "Tous les résultats",
                    values:
                        options.results,
                    selected:
                        filters.result
                })}

                ${renderSortSelect(
                    filters.sort
                )}

            </div>

        </section>
    `;
}

function renderSelect({
    id,
    label,
    values = [],
    selected = ""
}) {
    return `
        <select
            id="${escapeAttribute(id)}"
            class="sl-select"
        >

            <option value="">
                ${escapeHtml(label)}
            </option>

            ${values
                .map(value => `
                    <option
                        value="${escapeAttribute(value)}"
                        ${
                            String(value) ===
                            String(selected)
                                ? "selected"
                                : ""
                        }
                    >
                        ${escapeHtml(value)}
                    </option>
                `)
                .join("")}

        </select>
    `;
}

function renderSortSelect(selected = "date-desc") {
    const sorts = [
        ["date-desc", "Date : plus récente"],
        ["date-asc", "Date : plus ancienne"],
        ["probability", "Probabilité"],
        ["confidence", "Confiance"],
        ["value", "Value"],
        ["profit", "Profit"],
        ["competition", "Compétition"]
    ];

    return `
        <select
            id="filter-sort"
            class="sl-select"
        >

            ${sorts
                .map(([value, label]) => `
                    <option
                        value="${value}"
                        ${
                            value === selected
                                ? "selected"
                                : ""
                        }
                    >
                        ${label}
                    </option>
                `)
                .join("")}

        </select>
    `;
}

/* =========================================================
   CARTES DU JOURNAL
   ========================================================= */

function renderJournalCard(entry = {}) {
    const result =
        normalizeResult(entry.result);

    const decision =
        normalizeDecision(entry.decision);

    const cardClass =
        getJournalCardClass({
            decision,
            result,
            placed:
                entry.placed === true
        });

    return `
        <article class="sl-card journal-card ${cardClass}">

            <header class="journal-card-header">

                <div class="journal-card-heading">

                    <div class="journal-card-context">

                        <span>
                            ${getSportIcon(entry.sport)}
                        </span>

                        <span class="sl-muted">
                            ${escapeHtml(
                                entry.competition ||
                                "Compétition non renseignée"
                            )}
                        </span>

                    </div>

                    <h3>
                        ${escapeHtml(
                            entry.match ||
                            "Match non renseigné"
                        )}
                    </h3>

                    <p class="sl-muted">
                        ${formatDate(entry.date)}
                    </p>

                </div>

                ${renderDecisionBadge(
                    decision
                )}

            </header>

            <div class="journal-card-metrics">

                ${renderMetric(
                    "Probabilité",
                    formatModelPercent(
                        entry.probability
                    )
                )}

                ${renderMetric(
                    "Value",
                    formatModelPercent(
                        entry.value,
                        true
                    ),
                    getNumberClass(
                        entry.value
                    )
                )}

                ${renderMetric(
                    "Confiance",
                    formatModelPercent(
                        entry.confidence
                    )
                )}

                ${renderMetric(
                    "Marché",
                    entry.market || "-"
                )}

            </div>

            <footer class="journal-card-footer">

                <div class="journal-card-tags">

                    <span class="sl-badge sl-badge-neutral">

                        🤖
                        ${escapeHtml(
                            entry.source ||
                            "SportLab"
                        )}

                    </span>

                    ${
                        entry.placed
                            ? `
                                <span class="sl-badge sl-badge-info">
                                    🎯 Pari placé
                                </span>
                            `
                            : `
                                <span class="sl-badge sl-badge-neutral">
                                    👁️ Analyse
                                </span>
                            `
                    }

                    ${
                        entry.placed
                            ? renderResultStatusBadge(
                                result
                            )
                            : ""
                    }

                </div>

                ${
                    entry.placed
                        ? `
                            <strong
                                class="
                                    journal-profit
                                    ${getNumberClass(
                                        entry.profit
                                    )}
                                "
                            >
                                ${formatSignedCurrency(
                                    entry.profit
                                )}
                            </strong>
                        `
                        : ""
                }

            </footer>

        </article>
    `;
}

function renderMetric(
    label,
    value,
    valueClass = ""
) {
    return `
        <div class="journal-metric">

            <span class="sl-label">
                ${escapeHtml(label)}
            </span>

            <strong
                class="sl-value ${valueClass}"
            >
                ${escapeHtml(value)}
            </strong>

        </div>
    `;
}

/* =========================================================
   BADGES MÉTIER
   ========================================================= */

function renderDecisionBadge(decision) {
    if (
        decision === "VALUE" ||
        decision === "VALUE BET" ||
        decision === "BET"
    ) {
        return `
            <span class="sl-badge sl-badge-success">
                💎 VALUE
            </span>
        `;
    }

    if (
        decision === "NO VALUE" ||
        decision === "NO BET"
    ) {
        return `
            <span class="sl-badge sl-badge-danger">
                ⛔ NO VALUE
            </span>
        `;
    }

    return `
        <span class="sl-badge sl-badge-warning">
            ⏳ ${escapeHtml(
                decision || "PENDING"
            )}
        </span>
    `;
}

function renderResultStatusBadge(result) {
    switch (result) {
        case "WON":
            return `
                <span class="sl-badge sl-badge-success">
                    ✅ WON
                </span>
            `;

        case "LOST":
            return `
                <span class="sl-badge sl-badge-danger">
                    ❌ LOST
                </span>
            `;

        case "PUSH":
            return `
                <span class="sl-badge sl-badge-info">
                    ↔️ PUSH
                </span>
            `;

        default:
            return `
                <span class="sl-badge sl-badge-warning">
                    ⏳ PENDING
                </span>
            `;
    }
}

/* =========================================================
   EMPTY STATE
   ========================================================= */

function renderEmptyState() {
    return `
        <div class="sl-empty-state">

            <span class="sl-empty-state-icon">
                📭
            </span>

            <h3>
                Aucune entrée trouvée
            </h3>

            <p>
                Modifie les filtres ou enregistre une nouvelle analyse.
            </p>

        </div>
    `;
}

/* =========================================================
   HELPERS D’AFFICHAGE
   ========================================================= */

function getJournalCardClass({
    decision,
    result,
    placed
}) {
    if (placed && result === "WON") {
        return "sl-card-success";
    }

    if (placed && result === "LOST") {
        return "sl-card-danger";
    }

    if (
        decision === "VALUE" ||
        decision === "VALUE BET" ||
        decision === "BET"
    ) {
        return "sl-card-success";
    }

    if (
        decision === "NO VALUE" ||
        decision === "NO BET"
    ) {
        return "sl-card-danger";
    }

    return "sl-card-warning";
}

function getFinancialBadgeClass(roi) {
    if (toNumber(roi) > 0) {
        return "sl-badge-success";
    }

    if (toNumber(roi) < 0) {
        return "sl-badge-danger";
    }

    return "sl-badge-neutral";
}

function getNumberClass(value) {
    const number =
        toNumber(value);

    if (number > 0) {
        return "sl-positive";
    }

    if (number < 0) {
        return "sl-negative";
    }

    return "";
}

function getRoiIcon(value) {
    const roi =
        toNumber(value);

    if (roi > 0) {
        return "📈";
    }

    if (roi < 0) {
        return "📉";
    }

    return "➖";
}

function getSportIcon(sport) {
    const normalized =
        String(sport || "")
            .trim()
            .toLowerCase();

    if (
        normalized === "football" ||
        normalized === "foot"
    ) {
        return "⚽";
    }

    if (normalized === "rugby") {
        return "🏉";
    }

    return "🏟️";
}

function normalizeDecision(value) {
    const decision =
        String(value || "")
            .trim()
            .toUpperCase();

    if (
        decision === "NO_VALUE" ||
        decision === "NOVALUE"
    ) {
        return "NO VALUE";
    }

    return decision;
}

function normalizeResult(value) {
    const result =
        String(value || "")
            .trim()
            .toUpperCase();

    if (result === "WIN") {
        return "WON";
    }

    if (result === "LOSS") {
        return "LOST";
    }

    if (
        result === "WON" ||
        result === "LOST" ||
        result === "PUSH"
    ) {
        return result;
    }

    return "PENDING";
}

function formatInteger(value) {
    return Math.max(
        0,
        Math.round(
            toNumber(value)
        )
    ).toLocaleString("fr-FR");
}

function formatCurrency(value) {
    return toNumber(value)
        .toLocaleString(
            "fr-FR",
            {
                style: "currency",
                currency: "EUR",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        );
}

function formatSignedCurrency(value) {
    const number =
        toNumber(value);

    const formatted =
        Math.abs(number)
            .toLocaleString(
                "fr-FR",
                {
                    style: "currency",
                    currency: "EUR",
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }
            );

    if (number > 0) {
        return `+${formatted}`;
    }

    if (number < 0) {
        return `−${formatted}`;
    }

    return formatted;
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

/**
 * Les probabilités SportLab peuvent être enregistrées :
 * - sous forme décimale : 0.62 ;
 * - ou déjà en pourcentage : 62.
 */
function formatModelPercent(
    value,
    signed = false
) {
    const number =
        toNumber(value);

    const percentage =
        Math.abs(number) <= 1
            ? number * 100
            : number;

    const formatted =
        Math.abs(percentage)
            .toLocaleString(
                "fr-FR",
                {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1
                }
            );

    if (signed && percentage > 0) {
        return `+${formatted} %`;
    }

    if (signed && percentage < 0) {
        return `−${formatted} %`;
    }

    return `${formatted} %`;
}

function formatDate(value) {
    if (!value) {
        return "Date non renseignée";
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return String(value);
    }

    return date.toLocaleString(
        "fr-FR",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );
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