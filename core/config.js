export const CONFIG = {
  appName: "SportLab V3",

  analysisWindowDays: 14,

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
      { id: 16, name: "Top 14", active: true },
      { id: 17, name: "Pro D2", active: true },
      { id: 54, name: "Champions Cup", active: true },
      { id: 80, name: "Bunnings NPC", active: true },
      { id: 71, name: "Super Rugby Pacific", active: true },

      { id: 51, name: "6 Nations", active: true },
      { id: 84, name: "Test Match", active: true },
      { id: 69, name: "Rugby World Cup", active: true },
      { id: 145, name: "Nations Championship", active: true }
    ]
  }
};