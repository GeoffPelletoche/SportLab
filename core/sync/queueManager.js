const QUEUE_KEY = "sportlab.v7.cloud.queue.v2";
const LEGACY_QUEUE_KEY = "sportlab.v7.cloud.queue";

function now() { return Date.now(); }
function identity(item) { return `${item.namespace}:${item.key}`; }
function fingerprintOf(item) {
  if (item?.fingerprint) return String(item.fingerprint);
  try { return JSON.stringify({ deleted: Boolean(item?.deleted), payload: item?.payload ?? null }); }
  catch { return String(item?.payload ?? ""); }
}
function readRaw(key) {
  try { const value = JSON.parse(localStorage.getItem(key)); return Array.isArray(value) ? value : []; }
  catch { return []; }
}
function normalize(item) {
  return {
    ...item,
    id: item.id || identity(item),
    attempts: Number(item.attempts || 0),
    nextAttemptAt: Number(item.nextAttemptAt || 0),
    queuedAt: Number(item.queuedAt || now()),
    lastAttemptAt: Number(item.lastAttemptAt || 0),
    lastError: String(item.lastError || "")
  };
}
function read() {
  const current = readRaw(QUEUE_KEY).map(normalize);
  if (current.length) return current;
  const legacy = readRaw(LEGACY_QUEUE_KEY).map(normalize);
  if (legacy.length) { write(legacy); localStorage.removeItem(LEGACY_QUEUE_KEY); }
  return legacy;
}
function write(items) { localStorage.setItem(QUEUE_KEY, JSON.stringify(items)); return items; }
function backoffMs(attempts) { return Math.min(5 * 60_000, 1_000 * (2 ** Math.min(attempts, 8))); }

export const queueManager = Object.freeze({
  key: QUEUE_KEY,
  list: read,
  ready(at = now()) { return read().filter(item => item.nextAttemptAt <= at); },
  enqueue(changes = []) {
    const map = new Map(read().map(item => [identity(item), item]));
    for (const change of changes) {
      if (!change?.namespace || !change?.key) continue;
      const previous = map.get(identity(change));
      const incoming = normalize({ ...previous, ...change, fingerprint: fingerprintOf(change), queuedAt: previous?.queuedAt || now() });
      const sameChange = previous && fingerprintOf(previous) === fingerprintOf(change);
      map.set(identity(change), normalize({
        ...previous,
        ...incoming,
        attempts: sameChange ? Number(previous.attempts || 0) : 0,
        nextAttemptAt: sameChange ? Number(previous.nextAttemptAt || 0) : 0,
        lastAttemptAt: sameChange ? Number(previous.lastAttemptAt || 0) : 0,
        queuedAt: previous?.queuedAt || now(),
        lastError: sameChange ? String(previous.lastError || "") : ""
      }));
    }
    return write([...map.values()]);
  },
  acknowledge(items = []) {
    const accepted = new Set(items.map(item => `${item.namespace || ""}:${item.key || item.recordKey || item.record_key || ""}`));
    return write(read().filter(item => !accepted.has(identity(item))));
  },
  acknowledgeKeys(keys = []) {
    const accepted = new Set(keys);
    return write(read().filter(item => !accepted.has(identity(item))));
  },
  fail(items = [], error = "Erreur de synchronisation") {
    const failed = new Set(items.map(identity));
    return write(read().map(item => {
      if (!failed.has(identity(item))) return item;
      const attempts = item.attempts + 1;
      return { ...item, attempts, lastAttemptAt: now(), nextAttemptAt: now() + backoffMs(attempts), lastError: String(error) };
    }));
  },
  defer(items = [], error = "Conflit de synchronisation", delays = [60_000, 5 * 60_000, 15 * 60_000, 60 * 60_000]) {
    const deferred = new Set(items.map(identity));
    return write(read().map(item => {
      if (!deferred.has(identity(item))) return item;
      const attempts = item.attempts + 1;
      const delay = delays[Math.min(attempts - 1, delays.length - 1)] ?? delays[delays.length - 1];
      return { ...item, attempts, lastAttemptAt: now(), nextAttemptAt: now() + delay, lastError: String(error) };
    }));
  },
  clear() { return write([]); },
  size() { return read().length; },
  diagnostics() {
    const items = read();
    return {
      size: items.length,
      ready: items.filter(item => item.nextAttemptAt <= now()).length,
      delayed: items.filter(item => item.nextAttemptAt > now()).length,
      maxAttempts: items.reduce((max, item) => Math.max(max, item.attempts), 0)
    };
  }
});
