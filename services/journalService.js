// services/journalService.js

import { getAnalyses } from "./analysisService.js";
import { getAllBets } from "./betService.js";

/**
 * SPORTLAB V6.3.1 — JOURNAL SERVICE
 *
 * Responsabilités :
 * - fusionner les analyses et les paris ;
 * - normaliser les données du Journal ;
 * - produire automatiquement les options de filtres ;
 * - appliquer la recherche et les filtres ;
 * - trier les entrées.
 */

const DEFAULT_FILTERS = Object.freeze({
    search: "",
    sport: "",
    source: "",
    competition: "",
    market: "",
    decision: "",
    result: "",
    placedOnly: false,
    sort: "date-desc"
});

/**
 * Retourne toutes les données nécessaires au Journal.
 *
 * Structure :
 *
 * {
 *   entries: [],
 *   options: {
 *     sports: [],
 *     sources: [],
 *     competitions: [],
 *     markets: [],
 *     decisions: [],
 *     results: []
 *   },
 *   filters: {}
 * }
 */
export function getJournalData(filters = {}) {
    const normalizedFilters = normalizeFilters(filters);

    const allEntries = mergeAnalysesAndBets();

    const options = buildFilterOptions(allEntries);

    const filteredEntries = applyFilters(
        allEntries,
        normalizedFilters
    );

    const sortedEntries = applySorting(
        filteredEntries,
        normalizedFilters.sort
    );

    return {
        entries: sortedEntries,
        options,
        filters: normalizedFilters,
        totalEntries: allEntries.length,
        filteredEntries: sortedEntries.length
    };
}

/**
 * Retourne uniquement les entrées du Journal.
 *
 * Cette fonction peut être utile aux autres services
 * qui n’ont pas besoin des options de filtres.
 */
export function getJournalEntries(filters = {}) {
    return getJournalData(filters).entries;
}

/**
 * Fusionne les analyses avec les paris correspondants.
 */
function mergeAnalysesAndBets() {
    const analyses = getSafeArray(getAnalyses());
    const bets = getSafeArray(getAllBets());

    return analyses.map(analysis => {
        const bet = findMatchingBet(
            analysis,
            bets
        );

        return createJournalEntry(
            analysis,
            bet
        );
    });
}

/**
 * Recherche le pari correspondant à une analyse.
 */
function findMatchingBet(analysis, bets) {
    return bets.find(bet => {
        if (
            hasSameIdentifier(
                bet?.analysisId,
                analysis?.id
            )
        ) {
            return true;
        }

        if (
            hasSameIdentifier(
                bet?.matchId,
                analysis?.matchId
            )
        ) {
            return true;
        }

        if (
            hasSameIdentifier(
                bet?.id,
                analysis?.betId
            )
        ) {
            return true;
        }

        return false;
    });
}

function hasSameIdentifier(firstValue, secondValue) {
    if (
        firstValue === undefined ||
        firstValue === null ||
        secondValue === undefined ||
        secondValue === null
    ) {
        return false;
    }

    return String(firstValue) === String(secondValue);
}

/**
 * Produit une entrée normalisée pour le Journal.
 */
function createJournalEntry(analysis, bet) {
    const homeTeam = normalizeText(
        analysis?.homeTeam
    );

    const awayTeam = normalizeText(
        analysis?.awayTeam
    );

    const match = normalizeText(
        analysis?.match
    ) || buildMatchLabel(
        homeTeam,
        awayTeam
    );

    const placed = bet?.placed === true;

    const result = placed
        ? normalizeResult(bet?.result)
        : "";

    return {
        id:
            analysis?.id ??
            analysis?.matchId ??
            createFallbackId(analysis),

        matchId:
            analysis?.matchId ?? "",

        betId:
            bet?.id ?? analysis?.betId ?? "",

        sport:
            normalizeText(analysis?.sport),

        source:
            normalizeText(analysis?.source),

        competition:
            normalizeText(analysis?.competition),

        match,

        homeTeam,

        awayTeam,

        market:
            normalizeText(analysis?.market),

        selection:
            normalizeText(
                analysis?.selection ??
                bet?.selection
            ),

        probability:
            toNumber(analysis?.probability),

        value:
            toNumber(
                analysis?.value ??
                analysis?.edge
            ),

        edge:
            toNumber(analysis?.edge),

        confidence:
            toNumber(analysis?.confidence),

        decision:
            normalizeDecision(
                analysis?.decision
            ),

        date:
            normalizeDate(
                analysis?.date ??
                analysis?.matchDate ??
                analysis?.createdAt
            ),

        placed,

        stake:
            toNumber(bet?.stake),

        odds:
            toNumber(bet?.odds),

        result,

        profit:
            calculateBetProfit(bet)
    };
}

/**
 * Construit automatiquement les options disponibles
 * à partir des entrées réellement présentes.
 */
function buildFilterOptions(entries) {
    return {
        sports:
            getUniqueSortedValues(
                entries,
                "sport"
            ),

        sources:
            getUniqueSortedValues(
                entries,
                "source"
            ),

        competitions:
            getUniqueSortedValues(
                entries,
                "competition"
            ),

        markets:
            getUniqueSortedValues(
                entries,
                "market"
            ),

        decisions:
            getUniqueSortedValues(
                entries,
                "decision"
            ),

        results:
            getUniqueSortedValues(
                entries.filter(
                    entry => entry.placed
                ),
                "result"
            )
    };
}

/**
 * Retourne les valeurs uniques et triées d’une propriété.
 */
function getUniqueSortedValues(entries, property) {
    return Array.from(
        new Set(
            entries
                .map(entry =>
                    normalizeText(
                        entry?.[property]
                    )
                )
                .filter(Boolean)
        )
    ).sort((firstValue, secondValue) =>
        firstValue.localeCompare(
            secondValue,
            "fr",
            {
                sensitivity: "base"
            }
        )
    );
}

/**
 * Applique la recherche et tous les filtres actifs.
 */
function applyFilters(entries, filters) {
    return entries.filter(entry => {
        if (
            filters.search &&
            !matchesSearch(
                entry,
                filters.search
            )
        ) {
            return false;
        }

        if (
            filters.sport &&
            !hasSameNormalizedValue(
                entry.sport,
                filters.sport
            )
        ) {
            return false;
        }

        if (
            filters.source &&
            !hasSameNormalizedValue(
                entry.source,
                filters.source
            )
        ) {
            return false;
        }

        if (
            filters.competition &&
            !hasSameNormalizedValue(
                entry.competition,
                filters.competition
            )
        ) {
            return false;
        }

        if (
            filters.market &&
            !hasSameNormalizedValue(
                entry.market,
                filters.market
            )
        ) {
            return false;
        }

        if (
            filters.decision &&
            !hasSameNormalizedValue(
                entry.decision,
                filters.decision
            )
        ) {
            return false;
        }

        if (
            filters.result &&
            !hasSameNormalizedValue(
                entry.result,
                filters.result
            )
        ) {
            return false;
        }

        if (
            filters.placedOnly &&
            entry.placed !== true
        ) {
            return false;
        }

        return true;
    });
}

/**
 * Recherche dans les champs principaux du Journal.
 */
function matchesSearch(entry, searchValue) {
    const searchableText = [
        entry.match,
        entry.homeTeam,
        entry.awayTeam,
        entry.competition,
        entry.market,
        entry.selection,
        entry.sport,
        entry.source,
        entry.decision,
        entry.result
    ]
        .map(normalizeSearchText)
        .join(" ");

    return searchableText.includes(
        normalizeSearchText(searchValue)
    );
}

/**
 * Applique le tri sélectionné.
 */
function applySorting(entries, sort = "date-desc") {
    const sortedEntries = [...entries];

    switch (sort) {
        case "date-asc":
            sortedEntries.sort(
                (firstEntry, secondEntry) =>
                    getTimestamp(firstEntry.date) -
                    getTimestamp(secondEntry.date)
            );
            break;

        case "profit":
            sortedEntries.sort(
                (firstEntry, secondEntry) =>
                    secondEntry.profit -
                    firstEntry.profit
            );
            break;

        case "value":
            sortedEntries.sort(
                (firstEntry, secondEntry) =>
                    secondEntry.value -
                    firstEntry.value
            );
            break;

        case "confidence":
            sortedEntries.sort(
                (firstEntry, secondEntry) =>
                    secondEntry.confidence -
                    firstEntry.confidence
            );
            break;

        case "probability":
            sortedEntries.sort(
                (firstEntry, secondEntry) =>
                    secondEntry.probability -
                    firstEntry.probability
            );
            break;

        case "competition":
            sortedEntries.sort(
                (firstEntry, secondEntry) =>
                    firstEntry.competition.localeCompare(
                        secondEntry.competition,
                        "fr",
                        {
                            sensitivity: "base"
                        }
                    )
            );
            break;

        case "date-desc":
        default:
            sortedEntries.sort(
                (firstEntry, secondEntry) =>
                    getTimestamp(secondEntry.date) -
                    getTimestamp(firstEntry.date)
            );
            break;
    }

    return sortedEntries;
}

/**
 * Normalise les filtres reçus du contrôleur.
 */
function normalizeFilters(filters) {
    return {
        ...DEFAULT_FILTERS,

        search:
            normalizeText(filters?.search),

        sport:
            normalizeText(filters?.sport),

        source:
            normalizeText(filters?.source),

        competition:
            normalizeText(filters?.competition),

        market:
            normalizeText(filters?.market),

        decision:
            normalizeText(filters?.decision),

        result:
            normalizeResultFilter(
                filters?.result
            ),

        placedOnly:
            filters?.placedOnly === true,

        sort:
            normalizeSort(filters?.sort)
    };
}

function normalizeSort(value) {
    const allowedSorts = new Set([
        "date-desc",
        "date-asc",
        "profit",
        "value",
        "confidence",
        "probability",
        "competition"
    ]);

    return allowedSorts.has(value)
        ? value
        : DEFAULT_FILTERS.sort;
}

function normalizeDecision(value) {
    const decision = normalizeText(value)
        .toUpperCase();

    if (!decision) {
        return "";
    }

    if (
        decision === "NO_VALUE" ||
        decision === "NOVALUE"
    ) {
        return "NO VALUE";
    }

    return decision;
}

function normalizeResult(value) {
    const result = normalizeText(value)
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

function normalizeResultFilter(value) {
    const result = normalizeText(value);

    return result
        ? normalizeResult(result)
        : "";
}

/**
 * Calcule le profit si celui-ci n’est pas déjà enregistré.
 */
function calculateBetProfit(bet) {
    if (!bet || bet.placed !== true) {
        return 0;
    }

    const storedProfit =
        Number(bet.profit);

    if (Number.isFinite(storedProfit)) {
        return round(storedProfit);
    }

    const stake =
        Math.max(
            toNumber(bet.stake),
            0
        );

    const odds =
        Math.max(
            toNumber(bet.odds),
            0
        );

    const result =
        normalizeResult(bet.result);

    if (result === "WON") {
        return round(
            stake * (odds - 1)
        );
    }

    if (result === "LOST") {
        return round(-stake);
    }

    return 0;
}

function buildMatchLabel(homeTeam, awayTeam) {
    if (homeTeam && awayTeam) {
        return `${homeTeam} vs ${awayTeam}`;
    }

    return homeTeam || awayTeam || "Match non renseigné";
}

function createFallbackId(analysis) {
    return [
        normalizeText(analysis?.source),
        normalizeText(analysis?.matchId),
        normalizeText(analysis?.date),
        normalizeText(analysis?.homeTeam),
        normalizeText(analysis?.awayTeam)
    ]
        .filter(Boolean)
        .join("-");
}

function normalizeDate(value) {
    if (!value) {
        return "";
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime())
        ? normalizeText(value)
        : date.toISOString();
}

function getTimestamp(value) {
    const timestamp =
        new Date(value).getTime();

    return Number.isFinite(timestamp)
        ? timestamp
        : 0;
}

function hasSameNormalizedValue(
    firstValue,
    secondValue
) {
    return normalizeSearchText(firstValue) ===
        normalizeSearchText(secondValue);
}

function normalizeSearchText(value) {
    return normalizeText(value)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}

function normalizeText(value) {
    return String(value ?? "").trim();
}

function getSafeArray(value) {
    return Array.isArray(value)
        ? value
        : [];
}

function toNumber(value) {
    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : 0;
}

function round(value) {
    return Math.round(
        (toNumber(value) + Number.EPSILON) * 100
    ) / 100;
}