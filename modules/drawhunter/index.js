export const drawHunterModule = Object.freeze({
  id: "drawhunter",
  label: "DrawHunter",
  sport: "football",
  capabilities: ["draw-analysis", "value", "workflow", "history"],
  async mount({ eventBus }) { eventBus.emit("drawhunter:ready", { protectedBusinessLogic: true }); },
  async unmount() {}
});
