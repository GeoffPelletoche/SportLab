export function createModuleRegistry({ eventBus, logger }) {
  const modules = new Map();
  let activeId = null;

  function register(definition) {
    if (!definition?.id) throw new Error("Un module SportLab doit avoir un identifiant.");
    if (modules.has(definition.id)) throw new Error(`Module déjà enregistré : ${definition.id}`);
    modules.set(definition.id, Object.freeze({ ...definition }));
    eventBus?.emit?.("module:registered", { id: definition.id });
    return definition;
  }
  async function mount(id, context = {}) {
    const next = modules.get(id);
    if (!next) throw new Error(`Module inconnu : ${id}`);
    if (activeId && activeId !== id) await modules.get(activeId)?.unmount?.(context);
    await next.mount?.(context);
    activeId = id;
    logger?.info?.("Module monté", { id });
    eventBus?.emit?.("module:mounted", { id });
    return next;
  }
  async function unmount(id = activeId, context = {}) {
    const current = modules.get(id);
    await current?.unmount?.(context);
    if (activeId === id) activeId = null;
    eventBus?.emit?.("module:unmounted", { id });
  }
  return Object.freeze({ register, mount, unmount, get: id => modules.get(id), list: () => [...modules.values()], active: () => activeId });
}
