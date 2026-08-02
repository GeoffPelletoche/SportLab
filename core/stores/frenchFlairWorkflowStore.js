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
  if (match?.evaluatedAt || match?.result && match.result !== "PENDING") return "resulted";
  return match?.predictionStatus === "OK" ? "pending" : "new";
}

export function statusLabel(status) {
  return ({ new:"Nouveau", pending:"À analyser", awaiting_result:"En attente du résultat", resulted:"Évaluée", archived:"Historique" })[normalizeStatus(status)] || "Nouveau";
}

function normalizeStatus(status) {
  const raw = String(status || "new").toLowerCase();
  const legacy = {
    analyzed: "awaiting_result",
    decided: "awaiting_result",
    value: "awaiting_result",
    tracked: "awaiting_result"
  };
  const normalized = legacy[raw] || raw;
  const allowed = ["new", "pending", "awaiting_result", "resulted", "archived"];
  return allowed.includes(normalized) ? normalized : "new";
}

function defaultContext() {
  return { filter:"all", scrollY:0, selectedMatchId:null, detailsMatchId:null };
}
