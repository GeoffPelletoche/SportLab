export function createDiffEngine({ collectChanges }) {
  let pending = false;
  let lastScanAt = 0;
  function markDirty() { pending = true; }
  function scan({ force = false } = {}) {
    if (!force && !pending) return [];
    const changes = collectChanges();
    pending = false;
    lastScanAt = Date.now();
    return changes;
  }
  return Object.freeze({ markDirty, scan, getStatus: () => ({ pending, lastScanAt }) });
}
