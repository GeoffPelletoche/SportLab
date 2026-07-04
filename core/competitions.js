export const COMPETITIONS = {
  drawhunter: [
    { id: 39, name: "Premier League", active: true },
    { id: 140, name: "La Liga", active: true },
    { id: 78, name: "Bundesliga", active: true },
    { id: 135, name: "Serie A", active: true },
    { id: 61, name: "Ligue 1", active: true }
  ],

  frenchflair: [
    { id: "top14", name: "Top 14", active: true },
    { id: "prod2", name: "Pro D2", active: true },
    { id: "super_rugby_pacific", name: "Super Rugby Pacific", active: true },
    { id: "npc", name: "Bunnings NPC", active: true },
    { id: "champions_cup", name: "Champions Cup", active: true },
    { id: "international_xv", name: "International XV", active: true },

    // 🔥 NEW ADDITION
    { id: "nations_championship", name: "Nations Championship", active: true }
  ]
};

/**
 * Add competition dynamically
 */
export function addCompetition(module, comp) {
  COMPETITIONS[module].push(comp);
}

/**
 * Remove competition dynamically
 */
export function removeCompetition(module, compId) {
  COMPETITIONS[module] =
    COMPETITIONS[module].filter(c => c.id !== compId);
}
