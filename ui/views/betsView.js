import { renderTeamLogo } from "../../core/ui/teamBranding.js";

function formatResultBadge(bet) {
  switch (bet.result) {
    case "WON":
      return `<span class="badge sl-badge badge-success">✅ Pari gagné</span>`;

    case "LOST":
      return `<span class="badge sl-badge badge-danger">❌ Pari perdu</span>`;

    case "PUSH":
      return `<span class="badge sl-badge badge-warning">↩️ Pari remboursé</span>`;

    case "PENDING":
      return `<span class="badge sl-badge badge-info">⏳ Pari en attente</span>`;

    case "NON_PLACED":
      return `<span class="badge sl-badge badge-secondary">📝 Analyse uniquement</span>`;

    default:
      return `<span class="badge sl-badge badge-secondary">Inconnu</span>`;
  }
}

function renderBet(bet, teamBrandingLookup = new Map()) {
  const branding = resolveBetBranding(bet, teamBrandingLookup);
  const stake = Number(bet.stake || 0);
  const odds = Number(bet.odds || 0);

  let profit = null;

  if (bet.result === "WON") {
    profit = stake * (odds - 1);
  }

  if (bet.result === "LOST") {
    profit = -stake;
  }

  if (bet.result === "PUSH") {
    profit = 0;
  }

  return `
    <section class="card bet-card">

      ${renderBetMatchup(bet, branding)}

      <p>
        <strong>${bet.source}</strong>
        • ${bet.sport}
      </p>

      ${
        bet.competition
          ? `<p>${bet.competition}</p>`
          : ""
      }

      <hr>

      <p>
        <strong>Marché :</strong>
        ${bet.market}
      </p>

      ${
        bet.line !== null && bet.line !== undefined
          ? `
            <p>
              <strong>Ligne :</strong>
              ${bet.line}
            </p>
          `
          : ""
      }

      <p>
        <strong>Cote :</strong>
        ${odds.toFixed(2)}
      </p>

      <p>
        <strong>Mise :</strong>
        ${stake.toFixed(2)} €
      </p>

      ${formatResultBadge(bet)}

      ${
        bet.result !== "PENDING" &&
        bet.result !== "NON_PLACED"
          ? `
            <hr>

            <p>
              <strong>Score final :</strong>
              ${bet.finalHomePoints ?? "-"}
              -
              ${bet.finalAwayPoints ?? "-"}
            </p>

            <p>
              <strong>Total :</strong>
              ${bet.finalTotalPoints ?? "-"}
            </p>

            <p>
              <strong>Statut :</strong>
              ${bet.finalStatus ?? "-"}
            </p>

            <p>
              <strong>Profit :</strong>
              ${
                profit >= 0
                  ? "+"
                  : ""
              }${profit.toFixed(2)} €
            </p>
          `
          : ""
      }

    </section>
  `;
}

export function renderBets(bets = [], teamBrandingLookup = new Map()) {
  const placedBets = bets.filter(
    bet => bet.placed === true
  );

  if (!placedBets.length) {
    return `
      <h2>🎯 Paris placés</h2>

      <p class="small sl-muted">
        Aucun pari placé pour le moment.
      </p>
    `;
  }

  const sorted = [...placedBets].sort(
    (a, b) =>
      (b.createdAt || 0) -
      (a.createdAt || 0)
  );

  return `
    <h2>🎯 Paris placés</h2>

    <pre id="settlement-debug"></pre>

    ${sorted.map(bet => renderBet(bet, teamBrandingLookup)).join("")}
  `;
}


function renderBetMatchup(bet = {}, branding = {}) {
  const parsed = splitMatchLabel(bet.match);
  const home = bet.home || bet.homeTeam || branding.home || parsed.home;
  const away = bet.away || bet.awayTeam || branding.away || parsed.away;

  return `
    <div class="bet-team-matchup">
      <span class="bet-team">
        ${renderTeamLogo({
          sport: bet.sport || branding.sport,
          teamId: bet.homeId ?? branding.homeId,
          teamName: home,
          logo: bet.homeLogo || branding.homeLogo,
          className: "sl-team-logo bet-team-logo"
        })}
        <strong>${escapeHtml(home || "Équipe domicile")}</strong>
      </span>
      <span class="bet-team-separator">vs</span>
      <span class="bet-team bet-team-away">
        ${renderTeamLogo({
          sport: bet.sport || branding.sport,
          teamId: bet.awayId ?? branding.awayId,
          teamName: away,
          logo: bet.awayLogo || branding.awayLogo,
          className: "sl-team-logo bet-team-logo"
        })}
        <strong>${escapeHtml(away || "Équipe extérieure")}</strong>
      </span>
    </div>
  `;
}

function resolveBetBranding(bet = {}, lookup = new Map()) {
  const parsed = splitMatchLabel(bet.match);
  const current = lookup?.resolve?.({
    matchId: bet.matchId,
    sport: bet.sport,
    home: bet.home || bet.homeTeam || parsed.home,
    away: bet.away || bet.awayTeam || parsed.away
  }) || lookup?.get?.(String(bet.matchId ?? "")) || {};
  return {
    sport: bet.sport || current.sport || "",
    homeId: bet.homeId ?? current.homeId ?? null,
    awayId: bet.awayId ?? current.awayId ?? null,
    homeLogo: bet.homeLogo || current.homeLogo || "",
    awayLogo: bet.awayLogo || current.awayLogo || "",
    home: bet.home || bet.homeTeam || current.home || "",
    away: bet.away || bet.awayTeam || current.away || ""
  };
}

function splitMatchLabel(value) {
  const parts = String(value || "").split(/\s+(?:vs|v|-)\s+/i);
  return {
    home: String(parts[0] || "").trim(),
    away: String(parts.slice(1).join(" vs ") || "").trim()
  };
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
