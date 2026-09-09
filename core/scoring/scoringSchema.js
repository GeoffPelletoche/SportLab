export const SCORING_SCHEMA_VERSION = "1.0.0";
export const MODEL_VERSIONS = Object.freeze({ drawhunter: "DH-11.3.4", frenchflair: "FF-8.0.0", nfl: "NFL-TOTALS-11.4.1" });
export function clampScore(value) { return Math.max(0, Math.min(100, Math.round(Number(value) || 0))); }
