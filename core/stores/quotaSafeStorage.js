const RECOVERABLE_PREFIXES = ["sportlab.v9.history."];

export function isStorageQuotaError(error) {
  return Boolean(error) && (
    error?.name === "QuotaExceededError" ||
    error?.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
    error?.code === 22 ||
    error?.code === 1014 ||
    /quota/i.test(String(error?.message || ""))
  );
}

export function purgeRecoverableLocalCache(storage = globalThis.localStorage) {
  if (!storage) return 0;
  const keys = [];
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (key && RECOVERABLE_PREFIXES.some(prefix => key.startsWith(prefix))) keys.push(key);
  }
  for (const key of keys) storage.removeItem(key);
  return keys.length;
}

export function quotaSafeSetItem(key, value, storage = globalThis.localStorage) {
  try {
    storage.setItem(key, value);
    return { recovered: false, purged: 0 };
  } catch (error) {
    if (!isStorageQuotaError(error)) throw error;
    const purged = purgeRecoverableLocalCache(storage);
    try {
      storage.setItem(key, value);
      console.warn(`[Storage] Quota récupéré : ${purged} cache(s) historique(s) supprimé(s).`);
      return { recovered: true, purged };
    } catch (retryError) {
      if (!isStorageQuotaError(retryError)) throw retryError;
      const wrapped = new Error("Stockage Safari saturé. SportLab n’a supprimé aucune analyse, aucun pari ni aucune donnée Cloud. Les caches historiques supprimables ont déjà été nettoyés, mais l’espace reste insuffisant.");
      wrapped.name = "SportLabStorageQuotaError";
      wrapped.cause = retryError;
      throw wrapped;
    }
  }
}
