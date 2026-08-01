/**
 * SPORTLAB V6.1 — DIAGNOSTIC SERVICE
 */

const STORAGE_KEY =
  "sportlab_settlement_debug";

export function getSettlementDiagnostic() {
  try {
    const json =
      localStorage.getItem(STORAGE_KEY);

    if (!json) {
      return null;
    }

    return JSON.parse(json);
  } catch (error) {
    console.error(
      "[Diagnostics] Lecture impossible :",
      error
    );

    return null;
  }
}
