// ui/controllers/journalController.js

import { getJournalData } from "../../services/journalService.js";
import { renderJournal } from "../views/journalView.js";

/**
 * SPORTLAB V6.3.1
 *
 * Contrôleur du Journal
 */

let appElement = null;

const filters = {
    search: "",
    sport: "",
    source: "",
    competition: "",
    market: "",
    decision: "",
    result: "",
    placedOnly: false,
    sort: "date-desc"
};

export function initializeJournalController(app) {

    appElement = app;

    refreshJournal();
}

function refreshJournal() {

    const journal =
        getJournalData(filters);

    appElement.innerHTML =
        renderJournal(journal);

    bindEvents();
}

function bindEvents() {

    bindInput(
        "journal-search",
        "search"
    );

    bindSelect(
        "filter-sport",
        "sport"
    );

    bindSelect(
        "filter-source",
        "source"
    );

    bindSelect(
        "filter-competition",
        "competition"
    );

    bindSelect(
        "filter-market",
        "market"
    );

    bindSelect(
        "filter-decision",
        "decision"
    );

    bindSelect(
        "filter-result",
        "result"
    );

    bindSelect(
        "filter-sort",
        "sort"
    );
}

function bindInput(id, key) {

    document
        .getElementById(id)
        ?.addEventListener("input", event => {

            filters[key] =
                event.target.value;

            refreshJournal();

        });
}

function bindSelect(id, key) {

    document
        .getElementById(id)
        ?.addEventListener("change", event => {

            filters[key] =
                event.target.value;

            refreshJournal();

        });
}