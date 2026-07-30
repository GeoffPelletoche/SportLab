import { MODEL_VERSIONS } from "../scoring/scoringSchema.js";
export function getModelVersion(moduleId) { return MODEL_VERSIONS[moduleId] || "SPORTLAB-8.0.0"; }
