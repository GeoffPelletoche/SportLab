const STORAGE_KEY = "sportlab_frenchflair_workflow_v1";
const CONTEXT_KEY = "sportlab_frenchflair_context_v1";

export function getFrenchFlairWorkflow() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return value && typeof value === "object" ? value : {};
  } catch { return {}; }
}

export function getFrenchFlairMatchWorkflow(matchId) {
  return getFrenchFlairWorkflow()[String(matchId)] || null;
}

export function saveFrenchFlairMatchWorkflow(matchId, patch = {}) {
  if (matchId === null || matchId === undefined) return null;
  const all = getFrenchFlairWorkflow();
  const key = String(matchId);
  const previous = all[key] || { matchId: key, status: "new", history: [] };
  const now = Date.now();
  const nextStatus = normalizeStatus(patch.status || previous.status);
  const event = patch.event ? {
    id: globalThis.crypto?.randomUUID?.() || `ff-${now}-${Math.random().toString(36).slice(2)}`,
    type: patch.event.type || nextStatus,
    label: patch.event.label || statusLabel(nextStatus),
    note: patch.event.note || "",
    at: now
  } : null;
  const next = {
    ...previous, ...patch, matchId: key, status: nextStatus,
    history: event ? [...(previous.history || []), event] : (previous.history || []),
    updatedAt: now, createdAt: previous.createdAt || now
  };
  delete next.event;
  all[key] = next;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  window.dispatchEvent(new CustomEvent("sportlab:frenchflair-workflow-updated", { detail: next }));
  return next;
}

export function archiveFrenchFlairMatch(matchId) {
  return saveFrenchFlairMatchWorkflow(matchId, { status: "archived", archived: true, event: { type: "archived", label: "Match archivé" } });
}

export function getFrenchFlairContext() {
  try { return JSON.parse(sessionStorage.getItem(CONTEXT_KEY)) || defaultContext(); }
  catch { return defaultContext(); }
}

export function saveFrenchFlairContext(patch = {}) {
  const next = { ...getFrenchFlairContext(), ...patch };
  sessionStorage.setItem(CONTEXT_KEY, JSON.stringify(next));
  return next;
}

export function deriveFrenchFlairWorkflowState(match, stored = null) {
  if (stored?.status) return normalizeStatus(stored.status);
  const decision = String(match?.decision || match?.finalDecision || "").toUpperCase();
  if (decision.includes("VALUE") && !decision.includes("NO VALUE")) return "value";
  if (decision) return "decided";
  if (match?.predictionStatus === "OK") return "pending";
  return "new";
}

export function statusLabel(status) {
  return ({ new:"Nouveau", pending:"À analyser", analyzed:"Analyse terminée", decided:"Décision prise", value:"VALUE", tracked:"Pari enregistré", resulted:"Résultat", archived:"Archivé" })[normalizeStatus(status)] || "Nouveau";
}

function normalizeStatus(status) {
  const allowed = ["new","pending","analyzed","decided","value","tracked","resulted","archived"];
  const normalized = String(status || "new").toLowerCase();
  return allowed.includes(normalized) ? normalized : "new";
}

function defaultContext() {
  return { filter:"all", scrollY:0, selectedMatchId:null, detailsMatchId:null };
}
