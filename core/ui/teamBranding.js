/**
 * SportLab V11.2.1 — Team Branding
 *
 * API-Sports exposes stable media URLs keyed by sport and team id.
 * The browser cache handles image reuse; failures are hidden gracefully.
 */
export function getTeamLogoUrl({ sport, teamId, logo } = {}) {
  if (typeof logo === "string" && /^https?:\/\//i.test(logo)) {
    return logo;
  }

  const id = Number(teamId);
  if (!Number.isFinite(id) || id <= 0) return "";

  const normalizedSport = String(sport || "").toLowerCase();
  if (normalizedSport === "football") {
    return `https://media.api-sports.io/football/teams/${id}.png`;
  }
  if (normalizedSport === "rugby") {
    return `https://media.api-sports.io/rugby/teams/${id}.png`;
  }
  return "";
}

export function renderTeamLogo({
  sport,
  teamId,
  teamName = "Équipe",
  logo,
  className = "sl-team-logo"
} = {}) {
  const src = getTeamLogoUrl({ sport, teamId, logo });
  if (!src) return "";

  return `<img
    class="${escapeAttribute(className)}"
    src="${escapeAttribute(src)}"
    alt="Logo ${escapeAttribute(teamName)}"
    width="28"
    height="28"
    loading="lazy"
    decoding="async"
    referrerpolicy="no-referrer"
    onerror="this.hidden=true"
  >`;
}

function escapeAttribute(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
