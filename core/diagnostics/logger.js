const LEVELS = Object.freeze({ debug: 10, info: 20, warn: 30, error: 40 });
const BUFFER_LIMIT = 150;

export function createLogger({ namespace = "SportLab", level = "info", eventBus = null } = {}) {
  const buffer = [];
  const threshold = LEVELS[level] ?? LEVELS.info;

  function write(entryLevel, message, context) {
    if ((LEVELS[entryLevel] ?? 100) < threshold) return null;
    const entry = Object.freeze({
      timestamp: new Date().toISOString(), namespace, level: entryLevel,
      message: String(message), context: context ?? null
    });
    buffer.push(entry);
    if (buffer.length > BUFFER_LIMIT) buffer.shift();
    eventBus?.emit?.("diagnostics:log", entry);
    const method = entryLevel === "debug" ? "debug" : entryLevel;
    console[method]?.(`[${namespace}] ${entry.message}`, context ?? "");
    return entry;
  }

  return Object.freeze({
    debug: (message, context) => write("debug", message, context),
    info: (message, context) => write("info", message, context),
    warn: (message, context) => write("warn", message, context),
    error: (message, context) => write("error", message, context),
    entries: () => [...buffer]
  });
}
