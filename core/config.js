export const CONFIG = {
  appName: "SportLab V3",

  analysisWindowDays: 7,

  api: {
    workerBaseUrl: "https://sportlab-api-bridge.geoffrey-pelletier.workers.dev"
  },

  drawhunter: {
    market: "DRAW",
    minValue: 0.01,
    competitions: [
      { id: 39, name: "Premier League", active: true },
      { id: 140, name: "La Liga", active: true },
      { id: 78, name: "Bundesliga", active: true },
      { id: 135, name: "Serie A", active: true },
      { id: 61, name: "Ligue 1", active: true }
    ]
  },

  frenchflair: {
    market: "OVER_UNDER",
    competitions: [
      { id: "top14", name: "Top 14", active: true },
      { id: "prod2", name: "Pro D2", active: true },
      { id: "super_rugby_pacific", name: "Super Rugby Pacific", active: true },
      { id: "npc", name: "Bunnings NPC", active: true },
      { id: "champions_cup", name: "Champions Cup", active: true },
      { id: "international_xv", name: "International XV", active: true },
      { id: "nations_championship", name: "Nations Championship", active: true }
    ]
  }
};