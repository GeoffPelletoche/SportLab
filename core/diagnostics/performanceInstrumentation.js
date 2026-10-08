const STARTED_AT = performance.now();
const wallStartedAt = new Date().toISOString();
const modules = new Map();
const scheduler = { enqueued: 0, started: 0, completed: 0, failed: 0, rateLimits: 0, totalQueueWaitMs: 0, maxQueueWaitMs: 0, totalRunMs: 0 };

function moduleState(name) {
  if (!modules.has(name)) modules.set(name, { startedAtMs: null, firstFixturesMs: null, firstAnalysisMs: null, fixturesReadyMs: null, completeMs: null, fixtureCount: 0, analysisCount: 0, snapshotAgeMs: null, snapshotStale: false, reusedMatches: 0, newMatches: 0, historyRequests: 0, historyErrors: 0, phases: [] });
  return modules.get(name);
}
function elapsed() { return Math.max(0, performance.now() - STARTED_AT); }
export function markModuleStart(name) { const s=moduleState(name); if (s.startedAtMs == null) s.startedAtMs=elapsed(); }
export function markModuleProgress(name, payload, reason="") {
  const s=moduleState(name); const now=elapsed(); const phase=payload?.meta?.serverSnapshot ? "server-snapshot" : payload?.meta?.snapshot ? "local-snapshot" : payload?.meta?.phase || reason || "progress"; const matches=Array.isArray(payload?.matches)?payload.matches:[];
  const analyses=matches.filter(m => Array.isArray(m?.homeHistory)&&m.homeHistory.length&&Array.isArray(m?.awayHistory)&&m.awayHistory.length).length;
  if (matches.length && s.firstFixturesMs == null) s.firstFixturesMs=now;
  if (analyses && s.firstAnalysisMs == null) s.firstAnalysisMs=now;
  if ((payload?.meta?.phase === "history" || payload?.meta?.phase === "complete") && s.fixturesReadyMs == null) s.fixturesReadyMs = now;
  if (Number.isFinite(Number(payload?.meta?.snapshotAgeMs))) s.snapshotAgeMs = Number(payload.meta.snapshotAgeMs);
  if (payload?.meta?.snapshotStale === true) s.snapshotStale = true;
  const hd = payload?.meta?.historyDiagnostics || {};
  if (Number.isFinite(Number(hd.reusedMatches))) s.reusedMatches = Math.max(s.reusedMatches, Number(hd.reusedMatches));
  if (Number.isFinite(Number(hd.newMatches))) s.newMatches = Math.max(s.newMatches, Number(hd.newMatches));
  if (Number.isFinite(Number(hd.requested))) s.historyRequests = Math.max(s.historyRequests, Number(hd.requested));
  if (Number.isFinite(Number(hd.errors))) s.historyErrors = Math.max(s.historyErrors, Number(hd.errors));
  s.fixtureCount=Math.max(s.fixtureCount,matches.length); s.analysisCount=Math.max(s.analysisCount,analyses);
  if (s.phases.length < 40) s.phases.push({ phase, atMs: Math.round(now), matches: matches.length, analyses });
}
export function markModuleComplete(name, payload) { markModuleProgress(name,payload,"complete"); const s=moduleState(name); s.completeMs=elapsed(); }
export function recordSchedulerEnqueue() { scheduler.enqueued += 1; return performance.now(); }
export function recordSchedulerStart(enqueuedAt) { const wait=Math.max(0,performance.now()-enqueuedAt); scheduler.started+=1; scheduler.totalQueueWaitMs+=wait; scheduler.maxQueueWaitMs=Math.max(scheduler.maxQueueWaitMs,wait); return performance.now(); }
export function recordSchedulerEnd(startedAt, ok=true) { scheduler.completed+=1; if(!ok)scheduler.failed+=1; scheduler.totalRunMs+=Math.max(0,performance.now()-startedAt); }
export function recordRateLimit(){ scheduler.rateLimits+=1; }
export function getPerformanceReport(){
  const moduleReport={}; for(const [name,s] of modules) moduleReport[name]={...s, startedAtMs:r(s.startedAtMs), firstFixturesMs:r(s.firstFixturesMs), firstAnalysisMs:r(s.firstAnalysisMs), fixturesReadyMs:r(s.fixturesReadyMs), completeMs:r(s.completeMs)};
  return { version:"11.8.4.8", sessionStartedAt:wallStartedAt, elapsedMs:Math.round(elapsed()), scheduler:{...scheduler,totalQueueWaitMs:Math.round(scheduler.totalQueueWaitMs),maxQueueWaitMs:Math.round(scheduler.maxQueueWaitMs),totalRunMs:Math.round(scheduler.totalRunMs),averageQueueWaitMs:scheduler.started?Math.round(scheduler.totalQueueWaitMs/scheduler.started):0}, modules:moduleReport };
}
export function formatPerformanceReport(){ return JSON.stringify(getPerformanceReport(),null,2); }
function r(v){return v==null?null:Math.round(v);}
