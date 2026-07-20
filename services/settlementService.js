// services/settlementService.js

import {
    settlePendingBets
} from "../core/engines/betSettlementEngine.js";

export async function runAutomaticSettlement() {
    try {
        const reports = await settlePendingBets();

        const safeReports = Array.isArray(reports)
            ? reports
            : [];

        return {
            success: true,
            reports: safeReports,
            settledCount: safeReports.filter(
                report => report?.status === "SETTLED"
            ).length,
            errorCount: safeReports.filter(
                report => report?.status === "ERROR"
            ).length
        };
    } catch (error) {
        console.error(
            "[SettlementService] Échec du règlement automatique :",
            error
        );

        return {
            success: false,
            reports: [],
            settledCount: 0,
            errorCount: 1,
            error:
                error instanceof Error
                    ? error.message
                    : "UNKNOWN_ERROR"
        };
    }
}
