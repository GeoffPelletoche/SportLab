export const frenchFlairModule = Object.freeze({
  id: "frenchflair",
  label: "FrenchFlair",
  sport: "rugby",
  capabilities: ["totals-analysis", "sigma", "value", "settlement", "workflow"],
  async mount({ eventBus }) { eventBus.emit("frenchflair:ready", { protectedBusinessLogic: true }); },
  async unmount() {}
});
