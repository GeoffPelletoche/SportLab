export function createSyncScheduler({ run, onOffline, intervalMs = 30_000, debounceMs = 500 }) {
  let interval = null;
  let debounce = null;
  let started = false;
  const onOnline = () => run("online");
  const onOfflineEvent = () => onOffline?.();
  const onVisibility = () => { if (document.visibilityState === "visible") run("visible"); };

  function schedule(reason = "change") {
    clearTimeout(debounce);
    debounce = setTimeout(() => run(reason), debounceMs);
  }
  function start() {
    if (started) return;
    started = true;
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOfflineEvent);
    document.addEventListener("visibilitychange", onVisibility);
    interval = setInterval(() => run("interval"), intervalMs);
    run("startup");
  }
  function stop() {
    clearInterval(interval); clearTimeout(debounce);
    interval = null; debounce = null; started = false;
    window.removeEventListener("online", onOnline);
    window.removeEventListener("offline", onOfflineEvent);
    document.removeEventListener("visibilitychange", onVisibility);
  }
  return Object.freeze({ start, stop, schedule, isStarted: () => started });
}
