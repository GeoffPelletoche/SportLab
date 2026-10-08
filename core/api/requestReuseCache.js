// Short-lived successful fixture reuse and single-flight request sharing.
// Failures are never cached, and a running request is released on either outcome.
export function createRequestReuseCache({ now = Date.now, ttlMs = 60000, maxEntries = 100 } = {}) {
  const recent = new Map();
  const inFlight = new Map();
  const clone = value => JSON.parse(JSON.stringify(value));
  function read(key) {
    const entry = recent.get(key);
    if (!entry) return null;
    const ageMs = now() - entry.savedAt;
    if (ageMs < 0 || ageMs >= ttlMs) { recent.delete(key); return null; }
    return { value: clone(entry.value), ageMs };
  }
  function write(key, value) {
    recent.delete(key);
    recent.set(key, { value: clone(value), savedAt: now() });
    while (recent.size > maxEntries) recent.delete(recent.keys().next().value);
  }
  function run(key, task, onReuse = () => {}) {
    if (inFlight.has(key)) { onReuse(); return inFlight.get(key).then(clone); }
    // Reserve before invoking task, including synchronous re-entry.
    const promise = Promise.resolve().then(task).finally(() => inFlight.delete(key));
    inFlight.set(key, promise);
    return promise;
  }
  return { read, write, run };
}
