// ui/controllers/journalController.js

import { getJournalData } from "../../services/journalService.js";
import { renderJournal } from "../views/journalView.js";

/**
 * SPORTLAB V6.3.1
 *
 * Contrôleur du Journal.
 *
 * Rôle :
 * - écouter les filtres
 * - appeler journalService
 * - rafraîchir la vue
 */

let appElement = null;

const filters = {
    search: "",
    sport: "",
    source: "",
    decision: "",
    result: "",
    placedOnly: false,
    sort: "date-desc"
};

export function initializeJournalController(app) {

    appElement = app;

    bindEvents();

    refreshJournal();
}

function bindEvents() {

    document
        .getElementById("journal-search")
        ?.addEventListener(
            "input",
            event => {

                filters.search =
                    event.target.value;

                refreshJournal();

            });

    document
        .getElementById("filter-sport")
        ?.addEventListener(
            "change",
            event => {

                filters.sport =
                    event.target.value;

                refreshJournal();

            });

    document
        .getElementById("filter-source")
        ?.addEventListener(
            "change",
            event => {

                filters.source =
                    event.target.value;

                refreshJournal();

            });

    document
        .getElementById("filter-decision")
        ?.addEventListener(
            "change",
            event => {

                filters.decision =
                    event.target.value;

                refreshJournal();

            });

    document
        .getElementById("filter-result")
        ?.addEventListener(
            "change",
            event => {

                filters.result =
                    event.target.value;

                refreshJournal();

            });

    document
        .getElementById("filter-sort")
        ?.addEventListener(
            "change",
            event => {

                filters.sort =
                    event.target.value;

                refreshJournal();

            });
}

function refreshJournal() {

    const entries =
        getJournalData(filters);

    appElement.innerHTML =
        renderJournal(entries);

    bindEvents();
}