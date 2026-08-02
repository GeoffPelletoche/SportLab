const STORAGE_KEY = "sportlab_settlement_debug";

export function getSettlementDiagnostic() {
  try {
    const json = localStorage.getItem(STORAGE_KEY);
    return json ? JSON.parse(json) : null;
  } catch (error) {
    console.error("[Diagnostics] Lecture impossible :", error);
    return null;
  }
}

export function buildApplicationDiagnostic({
  drawhunterPayload,
  frenchflairPayload,
  settlement = null
} = {}) {
  return {
    checkedAt: new Date().toISOString(),
    location: {
      origin: window.location.origin,
      pathname: window.location.pathname,
      displayMode: window.matchMedia("(display-mode: standalone)").matches
        ? "standalone"
        : "browser",
      online: navigator.onLine
    },
    modules: {
      drawhunter: buildModuleDiagnostic(drawhunterPayload),
      frenchflair: buildModuleDiagnostic(frenchflairPayload)
    },
    settlement
  };
}

function buildModuleDiagnostic(payload) {
  const matches = Array.isArray(payload?.matches) ? payload.matches : [];
  const meta = payload?.meta && typeof payload.meta === "object" ? payload.meta : {};
  const syncLog = Array.isArray(meta.syncLog) ? meta.syncLog : [];
  const history = meta.historyDiagnostics && typeof meta.historyDiagnostics === "object"
    ? meta.historyDiagnostics
    : {};

  const analyzable = matches.filter(match =>
    match?.predictionStatus === "OK" || Number(match?.confidence || 0) > 0
  ).length;

  return {
    matches: matches.length,
    analyzable,
    withoutAnalysis: Math.max(0, matches.length - analyzable),
    syncedAt: meta.syncedAt || null,
    error: Boolean(meta.error),
    errorMessage: meta.errorMessage || null,
    competitions: Number(meta.competitions || 0),
    syncOk: syncLog.filter(item => item?.status === "OK").length,
    syncErrors: syncLog.filter(item => item?.status === "ERROR").length,
    syncLog,
    history: {
      requested: Number(history.requested || 0),
      apiSuccess: Number(history.apiSuccess || 0),
      cacheFallback: Number(history.cacheFallback || 0),
      emptyResponses: Number(history.emptyResponses || 0),
      errors: Number(history.errors || 0),
      gamesLoaded: Number(history.gamesLoaded || 0),
      matchesLoaded: Number(history.gamesLoaded || 0)
    }
  };
}
