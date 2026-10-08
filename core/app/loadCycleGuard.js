// One module execution per explicit load cycle, including synchronous re-entry.
export function createLoadCycleGuard({ sessionId = new Date().toISOString() } = {}) {
  let sequence = 0;
  const claims = new WeakMap();
  function createCycle(trigger, parentCycleId = null) {
    const cycle = Object.freeze({ loadCycleId: `${sessionId}#${++sequence}`, trigger, parentCycleId });
    claims.set(cycle, new Map());
    return cycle;
  }
  function snapshotVersion(payload) {
    return payload?.meta?.snapshotSavedAt || payload?.meta?.syncedAt || "none";
  }
  function claim(module, cycle, payload) {
    const modules = claims.get(cycle);
    if (!modules) throw new Error("Unknown load cycle");
    // Stronger than tuple idempotence: a payload publication cannot reopen a cycle.
    if (modules.has(module)) return false;
    modules.set(module, Object.freeze({ ...cycle, module, snapshotVersion: snapshotVersion(payload) }));
    return true;
  }
  function context(module, cycle) { return claims.get(cycle)?.get(module) || null; }
  return { createCycle, snapshotVersion, claim, context };
}
