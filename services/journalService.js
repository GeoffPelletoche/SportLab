// services/journalService.js

import { getAnalyses } from "./analysisService.js";
import { getAllBets } from "./betService.js";

/**
 * SPORTLAB V6.3.1 — JOURNAL SERVICE
 *
 * Rôle unique :
 * préparer les données du Journal.
 *
 * Aucune logique dans la vue.
 */

/**
 * Retourne le Journal complet.
 */
export function getJournalData(filters = {}) {
    let entries = mergeAnalysesAndBets();

    entries = applyFilters(entries, filters);
    entries = applySorting(entries, filters.sort);

    return entries;
}

/**
 * Fusionne les analyses avec les paris.
 */
function mergeAnalysesAndBets() {
    const analyses = getAnalyses() ?? [];
    const bets = getAllBets() ?? [];

    return analyses.map(analysis => {
        const bet = bets.find(
            b =>
                b.analysisId === analysis.id ||
                b.matchId === analysis.matchId ||
                b.id === analysis.betId
        );

        return {
            id: analysis.id,

            sport:
                analysis.sport ?? "",

            source:
                analysis.source ?? "",

            competition:
                analysis.competition ?? "",

            match:
                analysis.match ??
                `${analysis.homeTeam ?? ""} vs ${analysis.awayTeam ?? ""}`,

            homeTeam:
                analysis.homeTeam ?? "",

            awayTeam:
                analysis.awayTeam ?? "",

            market:
                analysis.market ?? "",

            probability:
                Number(analysis.probability ?? 0),

            value:
                Number(analysis.value ?? 0),

            edge:
                Number(analysis.edge ?? 0),

            confidence:
                Number(analysis.confidence ?? 0),

            decision:
                analysis.decision ?? "",

            date:
                analysis.date ?? "",

            placed:
                bet?.placed === true,

            stake:
                Number(bet?.stake ?? 0),

            odds:
                Number(bet?.odds ?? 0),

            result:
                bet?.result ?? "PENDING",

            profit:
                Number(bet?.profit ?? 0)
        };
    });
}

/**
 * Tous les filtres du Journal.
 */
function applyFilters(entries, filters = {}) {

    let result = [...entries];

    if (filters.search) {
        const search = filters.search.toLowerCase();

        result = result.filter(entry =>
            [
                entry.match,
                entry.homeTeam,
                entry.awayTeam,
                entry.competition,
                entry.market
            ]
                .join(" ")
                .toLowerCase()
                .includes(search)
        );
    }

    if (filters.sport) {
        result = result.filter(
            entry => entry.sport === filters.sport
        );
    }

    if (filters.source) {
        result = result.filter(
            entry => entry.source === filters.source
        );
    }

    if (filters.decision) {
        result = result.filter(
            entry => entry.decision === filters.decision
        );
    }

    if (filters.result) {
        result = result.filter(
            entry => entry.result === filters.result
        );
    }

    if (filters.placedOnly) {
        result = result.filter(
            entry => entry.placed
        );
    }

    return result;
}

/**
 * Tri des résultats.
 */
function applySorting(entries, sort = "date-desc") {

    const result = [...entries];

    switch (sort) {

        case "date-asc":
            result.sort(
                (a, b) =>
                    new Date(a.date) -
                    new Date(b.date)
            );
            break;

        case "profit":
            result.sort(
                (a, b) =>
                    b.profit - a.profit
            );
            break;

        case "value":
            result.sort(
                (a, b) =>
                    b.value - a.value
            );
            break;

        case "confidence":
            result.sort(
                (a, b) =>
                    b.confidence - a.confidence
            );
            break;

        case "probability":
            result.sort(
                (a, b) =>
                    b.probability - a.probability
            );
            break;

        default:
            result.sort(
                (a, b) =>
                    new Date(b.date) -
                    new Date(a.date)
            );
    }

    return result;
}