function resolveStorage(kind) {
  try {
    const candidate = kind === "session" ? window.sessionStorage : window.localStorage;
    const probe = "__sportlab_storage_probe__";
    candidate.setItem(probe, "1"); candidate.removeItem(probe);
    return candidate;
  } catch { return null; }
}

export function createStorageService({ kind = "local", prefix = "" } = {}) {
  const backend = resolveStorage(kind);
  const memory = new Map();
  const keyOf = key => `${prefix}${key}`;

  function get(key, fallback = null) {
    const resolved = keyOf(key);
    const value = backend ? backend.getItem(resolved) : memory.get(resolved);
    return value ?? fallback;
  }
  function set(key, value) {
    const resolved = keyOf(key);
    backend ? backend.setItem(resolved, String(value)) : memory.set(resolved, String(value));
    return value;
  }
  function remove(key) {
    const resolved = keyOf(key);
    backend ? backend.removeItem(resolved) : memory.delete(resolved);
  }
  function getJSON(key, fallback = null) {
    try { const raw = get(key); return raw === null ? fallback : JSON.parse(raw); } catch { return fallback; }
  }
  function setJSON(key, value) { set(key, JSON.stringify(value)); return value; }
  return Object.freeze({ kind, get, set, remove, getJSON, setJSON, available: Boolean(backend) });
}

export const localStorageService = createStorageService({ kind: "local" });
export const sessionStorageService = createStorageService({ kind: "session" });
