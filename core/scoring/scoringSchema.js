export const SCORING_SCHEMA_VERSION = "1.0.0";
export const MODEL_VERSIONS = Object.freeze({ drawhunter: "DH-8.0.0", frenchflair: "FF-8.0.0" });
export function clampScore(value) { return Math.max(0, Math.min(100, Math.round(Number(value) || 0))); }
