export function createLifecycle({ eventBus, logger }) {
  const cleanupTasks = new Set();
  function addCleanup(task) { if (typeof task === "function") cleanupTasks.add(task); return () => cleanupTasks.delete(task); }
  async function start(context) { eventBus.emit("app:before-start", context); logger.info("Cycle de vie V7 démarré"); eventBus.emit("app:started", context); }
  async function stop(context) { for (const task of [...cleanupTasks].reverse()) await task(); cleanupTasks.clear(); eventBus.emit("app:stopped", context); }
  return Object.freeze({ start, stop, addCleanup });
}
