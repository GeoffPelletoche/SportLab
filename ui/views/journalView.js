// ui/views/journalView.js

/**
 * SPORTLAB V6.3.1
 *
 * JOURNAL VIEW
 *
 * Affichage uniquement.
 */

function escapeHtml(value = "") {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function renderOptions(values, selected = "") {

    return values.map(value => `

        <option
            value="${escapeHtml(value)}"
            ${value === selected ? "selected" : ""}
        >

            ${escapeHtml(value)}

        </option>

    `).join("");

}

function renderBadge(text, css) {

    return `
        <span class="badge ${css}">
            ${escapeHtml(text)}
        </span>
    `;

}

function renderCard(entry) {

    const decisionBadge =
        entry.decision === "VALUE"
            ? renderBadge("VALUE", "badge-success")
            : renderBadge(
                entry.decision || "Analyse",
                "badge-neutral"
            );

    const resultBadge =
        renderBadge(
            entry.result || "PENDING",
            `badge-${String(
                entry.result || "pending"
            ).toLowerCase()}`
        );

    return `

<article class="journal-card">

    <header class="journal-card-header">

        <div>

            <h3>

                ${escapeHtml(entry.match)}

            </h3>

            <p class="small">

                ${escapeHtml(entry.competition)}

            </p>

        </div>

        ${decisionBadge}

    </header>

    <div class="journal-grid">

        <div>

            <span class="label">
                Sport
            </span>

            <strong>

                ${escapeHtml(entry.sport)}

            </strong>

        </div>

        <div>

            <span class="label">
                Module
            </span>

            <strong>

                ${escapeHtml(entry.source)}

            </strong>

        </div>

        <div>

            <span class="label">
                Probabilité
            </span>

            <strong>

                ${entry.probability} %

            </strong>

        </div>

        <div>

            <span class="label">
                Value
            </span>

            <strong>

                ${entry.value} %

            </strong>

        </div>

        <div>

            <span class="label">
                Confiance
            </span>

            <strong>

                ${entry.confidence} %

            </strong>

        </div>

        <div>

            <span class="label">
                Pari
            </span>

            <strong>

                ${entry.placed ? "Oui" : "Non"}

            </strong>

        </div>

        <div>

            <span class="label">
                Résultat
            </span>

            ${resultBadge}

        </div>

        <div>

            <span class="label">
                Profit
            </span>

            <strong>

                ${entry.profit.toFixed(2)} €

            </strong>

        </div>

    </div>

    <footer class="journal-footer">

        <span class="small">

            ${escapeHtml(entry.date)}

        </span>

    </footer>

</article>

`;

}

export function renderJournal(journal) {

    const {

        entries = [],

        options = {},

        filters = {},

        totalEntries = 0,

        filteredEntries = 0

    } = journal;

    return `

<section class="journal-page">

    <header class="journal-toolbar">

        <input

            id="journal-search"

            class="journal-search"

            type="search"

            value="${escapeHtml(filters.search)}"

            placeholder="🔍 Rechercher..."

        >

        <div class="journal-filters">

            <select id="filter-sport">

                <option value="">
                    Tous les sports
                </option>

                ${renderOptions(
                    options.sports || [],
                    filters.sport
                )}

            </select>

            <select id="filter-source">

                <option value="">
                    Tous les modules
                </option>

                ${renderOptions(
                    options.sources || [],
                    filters.source
                )}

            </select>

            <select id="filter-competition">

                <option value="">
                    Toutes les compétitions
                </option>

                ${renderOptions(
                    options.competitions || [],
                    filters.competition
                )}

            </select>

            <select id="filter-market">

                <option value="">
                    Tous les marchés
                </option>

                ${renderOptions(
                    options.markets || [],
                    filters.market
                )}

            </select>

            <select id="filter-decision">

                <option value="">
                    Toutes les décisions
                </option>

                ${renderOptions(
                    options.decisions || [],
                    filters.decision
                )}

            </select>

            <select id="filter-result">

                <option value="">
                    Tous les résultats
                </option>

                ${renderOptions(
                    options.results || [],
                    filters.result
                )}

            </select>

            <select id="filter-sort">

                <option
                    value="date-desc"
                    ${filters.sort === "date-desc" ? "selected" : ""}
                >
                    Date ↓
                </option>

                <option
                    value="date-asc"
                    ${filters.sort === "date-asc" ? "selected" : ""}
                >
                    Date ↑
                </option>

                <option
                    value="confidence"
                    ${filters.sort === "confidence" ? "selected" : ""}
                >
                    Confiance
                </option>

                <option
                    value="probability"
                    ${filters.sort === "probability" ? "selected" : ""}
                >
                    Probabilité
                </option>

                <option
                    value="value"
                    ${filters.sort === "value" ? "selected" : ""}
                >
                    Value
                </option>

                <option
                    value="profit"
                    ${filters.sort === "profit" ? "selected" : ""}
                >
                    Profit
                </option>

            </select>

        </div>

        <p class="small">

            ${filteredEntries}
            résultat(s)
            sur
            ${totalEntries}

        </p>

    </header>

    <section
        id="journal-list"
        class="journal-list"
    >

        ${entries.length === 0

            ? `

                <div class="empty-state">

                    <h3>

                        Aucune analyse trouvée

                    </h3>

                    <p>

                        Essayez de modifier vos filtres.

                    </p>

                </div>

            `

            : entries
                .map(renderCard)
                .join("")
        }

    </section>

</section>

`;

}