/** SportLab V7 Core — bus d'événements sans dépendance. */
export function createEventBus() {
  const listeners = new Map();

  function on(eventName, handler) {
    if (typeof handler !== "function") throw new TypeError("Le handler doit être une fonction.");
    const handlers = listeners.get(eventName) || new Set();
    handlers.add(handler);
    listeners.set(eventName, handlers);
    return () => off(eventName, handler);
  }

  function off(eventName, handler) {
    const handlers = listeners.get(eventName);
    if (!handlers) return false;
    const removed = handlers.delete(handler);
    if (!handlers.size) listeners.delete(eventName);
    return removed;
  }

  function emit(eventName, payload) {
    const handlers = [...(listeners.get(eventName) || [])];
    handlers.forEach(handler => {
      try { handler(payload); } catch (error) { console.error(`[SportLab EventBus] ${eventName}`, error); }
    });
    return handlers.length;
  }

  function clear(eventName) {
    if (eventName) return listeners.delete(eventName);
    listeners.clear();
    return true;
  }

  return Object.freeze({ on, off, emit, clear });
}

export const eventBus = createEventBus();
