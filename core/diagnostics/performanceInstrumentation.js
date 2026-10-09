const STARTED_AT = performance.now();
const wallStartedAt = new Date().toISOString();
const modules = new Map();
const contexts = new Map();
const requestReuse = { recent: 0, inFlight: 0, events: [] };
const bridgeDiagnostics = [];
const scheduler = { enqueued: 0, queued: 0, started: 0, completed: 0, failed: 0, deferred: 0, deferredEvents: [], rateLimits: 0, rateLimitEvents: [], totalQueueWaitMs: 0, maxQueueWaitMs: 0, totalRunMs: 0 };

function moduleState(name) {
  if (!modules.has(name)) modules.set(name, { startedAtMs: null, readyAtMs: null, cycles: [], firstFixturesMs: null, firstAnalysisMs: null, fixturesReadyMs: null, completeMs: null, fixtureCount: 0, analysisCount: 0, snapshotAgeMs: null, snapshotStale: false, reusedMatches: 0, newMatches: 0, historyRequests: 0, historyErrors: 0, refreshDecisions: [], phases: [] });
  return modules.get(name);
}
function elapsed() { return Math.max(0, performance.now() - STARTED_AT); }
export function markModuleStart(name, context = null) {
  const s = moduleState(name);
  if (s.startedAtMs == null) s.startedAtMs = elapsed();
  if (context) {
    contexts.set(name, { ...context, module: name });
    if (!s.cycles.some(c => c.loadCycleId === context.loadCycleId)) {
      s.cycles.push({ ...context, module: name, startedAtMs: Math.round(elapsed()), completeMs: null });
    }
  }
}
export function markModuleProgress(name, payload, reason="") {
  const s=moduleState(name); const now=elapsed(); const phase=payload?.meta?.serverSnapshot ? "server-snapshot" : payload?.meta?.snapshot ? "local-snapshot" : payload?.meta?.phase || reason || "progress"; const matches=Array.isArray(payload?.matches)?payload.matches:[];
  const analyses=matches.filter(m => Array.isArray(m?.homeHistory)&&m.homeHistory.length&&Array.isArray(m?.awayHistory)&&m.awayHistory.length).length;
  if (matches.length && s.firstFixturesMs == null) s.firstFixturesMs=now;
  if (analyses && s.firstAnalysisMs == null) s.firstAnalysisMs=now;
  if (payload?.meta?.loading !== true && payload?.meta?.error !== true
      && analyses === matches.length && s.readyAtMs == null) s.readyAtMs = now;
  if ((payload?.meta?.phase === "history" || payload?.meta?.phase === "complete") && s.fixturesReadyMs == null) s.fixturesReadyMs = now;
  if (Number.isFinite(Number(payload?.meta?.snapshotAgeMs))) s.snapshotAgeMs = Number(payload.meta.snapshotAgeMs);
  if (payload?.meta?.snapshotStale === true) s.snapshotStale = true;
  const hd = payload?.meta?.historyDiagnostics || {};
  if (Number.isFinite(Number(hd.reusedMatches))) s.reusedMatches = Math.max(s.reusedMatches, Number(hd.reusedMatches));
  if (Number.isFinite(Number(hd.newMatches))) s.newMatches = Math.max(s.newMatches, Number(hd.newMatches));
  if (Number.isFinite(Number(hd.requested))) s.historyRequests = Math.max(s.historyRequests, Number(hd.requested));
  if (Number.isFinite(Number(hd.errors))) s.historyErrors = Math.max(s.historyErrors, Number(hd.errors));
  s.fixtureCount=Math.max(s.fixtureCount,matches.length); s.analysisCount=Math.max(s.analysisCount,analyses);
  if (payload?.meta?.fixtureRefreshPolicy && reason === "complete") {
    const decision = { ...payload.meta.fixtureRefreshPolicy, loadCycleId: contexts.get(name)?.loadCycleId, trigger: contexts.get(name)?.trigger, atMs: Math.round(now) };
    if (!s.refreshDecisions.some(item => item.loadCycleId === decision.loadCycleId && item.reason === decision.reason)) s.refreshDecisions.push(decision);
  }
  const context = contexts.get(name) || { module: name, loadCycleId: null, trigger: reason, snapshotVersion: null, parentCycleId: null };
  if (phase === "complete" && reason !== "complete") return;
  const errors = (payload?.meta?.syncLog || []).filter(item => ["ERROR", "RATE_LIMITED"].includes(item.status))
    .map(({ competition, leagueId, message, code, httpStatus }) => ({ competition, leagueId, message, code, httpStatus }));
  const last = s.phases.at(-1);
  if (last?.loadCycleId === context.loadCycleId && last.reason === reason && last.phase === phase
      && last.matches === matches.length && last.analyses === analyses) return;
  if (s.phases.length < 120) s.phases.push({ ...context, phase, reason, ...(errors.length ? { errors } : {}), atMs: Math.round(now), matches: matches.length, analyses });
}
export function markModuleComplete(name, payload) {
  markModuleProgress(name, { ...payload, meta: { ...payload?.meta, snapshot: false, serverSnapshot: false, phase: "complete" } }, "complete");
  const s = moduleState(name);
  const cycle = s.cycles.find(c => c.loadCycleId === contexts.get(name)?.loadCycleId);
  if (!cycle || cycle.completeMs == null) {
    s.completeMs = elapsed();
    if (cycle) { cycle.completeMs = Math.round(s.completeMs); cycle.error = payload?.meta?.error === true || payload?.meta?.refreshError === true; }
  }
}
export function recordSchedulerEnqueue() { scheduler.enqueued += 1; return performance.now(); }
export function recordSchedulerQueueSize(size) { scheduler.queued = size; }
export function recordSchedulerDefer(detail) {
  scheduler.deferred = (scheduler.deferred || 0) + 1;
  scheduler.deferredEvents ||= [];
  if (scheduler.deferredEvents.length < 60) scheduler.deferredEvents.push({ ...detail, atMs: Math.round(elapsed()) });
}
export function recordBridgeDiagnostics(path, detail) {
  if (bridgeDiagnostics.length >= 40) bridgeDiagnostics.shift();
  bridgeDiagnostics.push({ path, ...detail, atMs: Math.round(elapsed()) });
}
export function recordSchedulerStart(enqueuedAt) { const wait=Math.max(0,performance.now()-enqueuedAt); scheduler.started+=1; scheduler.totalQueueWaitMs+=wait; scheduler.maxQueueWaitMs=Math.max(scheduler.maxQueueWaitMs,wait); return performance.now(); }
export function recordSchedulerEnd(startedAt, ok=true) { scheduler.completed+=1; if(!ok)scheduler.failed+=1; scheduler.totalRunMs+=Math.max(0,performance.now()-startedAt); }
export function recordRequestReuse(kind, path) {
  if (kind === "recent") requestReuse.recent += 1;
  else requestReuse.inFlight += 1;
  if (requestReuse.events.length < 40) requestReuse.events.push({ kind, path, atMs: Math.round(elapsed()) });
}
export function recordRateLimit(detail = {}) {
  scheduler.rateLimits += 1;
  if (scheduler.rateLimitEvents.length < 40) scheduler.rateLimitEvents.push({ ...detail, atMs: Math.round(elapsed()) });
}
export function getPerformanceReport(){
  const moduleReport={}; for(const [name,s] of modules) moduleReport[name]={...s, startedAtMs:r(s.startedAtMs), readyAtMs:r(s.readyAtMs), firstFixturesMs:r(s.firstFixturesMs), firstAnalysisMs:r(s.firstAnalysisMs), fixturesReadyMs:r(s.fixturesReadyMs), completeMs:r(s.completeMs)};
  return { version:"11.8.4.13", sessionStartedAt:wallStartedAt, elapsedMs:Math.round(elapsed()), requestReuse, bridgeDiagnostics, scheduler:{...scheduler,totalQueueWaitMs:Math.round(scheduler.totalQueueWaitMs),maxQueueWaitMs:Math.round(scheduler.maxQueueWaitMs),totalRunMs:Math.round(scheduler.totalRunMs),averageQueueWaitMs:scheduler.started?Math.round(scheduler.totalQueueWaitMs/scheduler.started):0}, modules:moduleReport };
}
export function formatPerformanceReport(){ return JSON.stringify(getPerformanceReport(),null,2); }
function r(v){return v==null?null:Math.round(v);}
