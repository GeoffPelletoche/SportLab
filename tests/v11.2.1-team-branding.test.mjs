import test from "node:test";
import assert from "node:assert/strict";
import { getTeamLogoUrl, renderTeamLogo } from "../core/ui/teamBranding.js";

test("construit une URL de logo football API-Sports", () => {
  assert.equal(getTeamLogoUrl({ sport: "football", teamId: 33 }), "https://media.api-sports.io/football/teams/33.png");
});

test("construit une URL de logo rugby API-Sports", () => {
  assert.equal(getTeamLogoUrl({ sport: "rugby", teamId: 95 }), "https://media.api-sports.io/rugby/teams/95.png");
});

test("le rendu du logo est paresseux et possède un fallback", () => {
  const html = renderTeamLogo({ sport: "rugby", teamId: 95, teamName: "Stade Toulousain" });
  assert.match(html, /loading="lazy"/);
  assert.match(html, /onerror="this.hidden=true"/);
  assert.match(html, /Stade Toulousain/);
});
