// ui/views/journalView.js

/**
 * SPORTLAB V6.3.1 — JOURNAL VIEW
 *
 * Affichage uniquement.
 * Aucune logique métier.
 */

function escapeHtml(value = "") {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function badge(text, css) {
    return `<span class="badge ${css}">${escapeHtml(text)}</span>`;
}

function renderCard(entry) {

    const decisionBadge =
        entry.decision === "VALUE"
            ? badge("VALUE", "badge-success")
            : badge("NO VALUE", "badge-neutral");

    const resultBadge = badge(
        entry.result || "PENDING",
        `badge-${String(entry.result || "pending").toLowerCase()}`
    );

    return `
    <article class="journal-card">

        <div class="journal-header">

            <div>

                <h3>
                    ${escapeHtml(entry.match)}
                </h3>

                <p class="small">
                    ${escapeHtml(entry.competition)}
                </p>

            </div>

            ${decisionBadge}

        </div>

        <div class="journal-grid">

            <div>

                <span class="label">Sport</span>

                <strong>${escapeHtml(entry.sport)}</strong>

            </div>

            <div>

                <span class="label">Module</span>

                <strong>${escapeHtml(entry.source)}</strong>

            </div>

            <div>

                <span class="label">Probabilité</span>

                <strong>${entry.probability}%</strong>

            </div>

            <div>

                <span class="label">Value</span>

                <strong>${entry.value}%</strong>

            </div>

            <div>

                <span class="label">Confiance</span>

                <strong>${entry.confidence}%</strong>

            </div>

            <div>

                <span class="label">Parié</span>

                <strong>${entry.placed ? "Oui" : "Non"}</strong>

            </div>

            <div>

                <span class="label">Résultat</span>

                ${resultBadge}

            </div>

            <div>

                <span class="label">Profit</span>

                <strong>${entry.profit} €</strong>

            </div>

        </div>

        <div class="journal-footer">

            <span class="small">

                ${escapeHtml(entry.date)}

            </span>

        </div>

    </article>
    `;
}

export function renderJournal(entries = []) {

    return `

<section class="journal-page">

    <header class="journal-toolbar">

        <input
            id="journal-search"
            class="journal-search"
            type="search"
            placeholder="🔍 Rechercher une équipe, une compétition..."
        >

        <div class="journal-filters">

            <select id="filter-sport">

                <option value="">
                    Tous les sports
                </option>

                <option>
                    Football
                </option>

                <option>
                    Rugby
                </option>

            </select>

            <select id="filter-source">

                <option value="">
                    Tous les modules
                </option>

                <option>
                    DrawHunter
                </option>

                <option>
                    FrenchFlair
                </option>

            </select>

            <select id="filter-decision">

                <option value="">
                    Toutes les décisions
                </option>

                <option>
                    VALUE
                </option>

                <option>
                    NO VALUE
                </option>

            </select>

            <select id="filter-result">

                <option value="">
                    Tous les résultats
                </option>

                <option>
                    WON
                </option>

                <option>
                    LOST
                </option>

                <option>
                    PUSH
                </option>

                <option>
                    PENDING
                </option>

            </select>

            <select id="filter-sort">

                <option value="date-desc">

                    Date ↓

                </option>

                <option value="date-asc">

                    Date ↑

                </option>

                <option value="confidence">

                    Confiance

                </option>

                <option value="probability">

                    Probabilité

                </option>

                <option value="value">

                    Value

                </option>

                <option value="profit">

                    Profit

                </option>

            </select>

        </div>

    </header>

    <section
        id="journal-list"
        class="journal-list"
    >

        ${
            entries.length === 0

                ? `

                <div class="empty-state">

                    <h3>
                        Aucune analyse disponible
                    </h3>

                    <p>

                        Le journal est vide.

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