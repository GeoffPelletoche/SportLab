import { readLearningDataset } from "../learning/learningDatasetBuilder.js";
import { getAnalysisForMatch } from "../stores/analysisStore.js";

/**
 * V11.4.8 — registre transversal des rencontres déjà évaluées.
 *
 * Une rencontre évaluée ne doit plus revenir dans les ateliers d'analyse,
 * qu'elle ait été analysée ou non, pariée ou non. Le dataset d'apprentissage
 * est la source primaire car il existe pour les trois modules, NFL inclus.
 * L'analysis store sert de garde supplémentaire pour les analyses déjà
 * clôturées par le cycle de vie.
 */
export function isMatchEvaluated(moduleId, matchId, storage = globalThis.localStorage) {
  if (matchId === null || matchId === undefined || matchId === "") return false;

  const normalizedModule = normalizeModule(moduleId);
  const key = String(matchId);
  const dataset = readLearningDataset(storage);

  const learned = dataset.some(item =>
    String(item?.matchId ?? "") === key &&
    normalizeModule(item?.moduleId) === normalizedModule &&
    Boolean(item?.evaluatedAt)
  );
  if (learned) return true;

  // getAnalysisForMatch utilise le localStorage applicatif. On ne l'emploie
  // que lorsque le storage demandé correspond au stockage global.
  if (storage === globalThis.localStorage) {
    const analysis = getAnalysisForMatch(matchId);
    if (analysis && (
      Boolean(analysis.evaluatedAt) ||
      ["RESULTED", "EVALUATED", "SETTLED"].includes(String(analysis.lifecycleStatus || analysis.status || "").toUpperCase()) ||
      ["WON", "LOST", "WIN", "LOSS", "PUSH", "VOID"].includes(String(analysis.result || "").toUpperCase())
    )) return true;
  }

  return false;
}

export function filterUnevaluatedMatches(moduleId, matches = [], storage = globalThis.localStorage) {
  return (Array.isArray(matches) ? matches : []).filter(match =>
    !isMatchEvaluated(moduleId, match?.id ?? match?.matchId ?? match?.fixtureId, storage)
  );
}

function normalizeModule(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (raw.includes("nfl") || raw.includes("american")) return "nfl";
  if (raw.includes("draw") || (raw.includes("foot") && !raw.includes("american"))) return "drawhunter";
  if (raw.includes("french") || raw.includes("rugby")) return "frenchflair";
  return raw;
}
