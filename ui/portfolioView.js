/**
 * SPORTLAB V3 — PORTFOLIO VIEW
 * Rôle unique :
 * afficher le résumé ROI et l’état du portefeuille.
 */

export function renderPortfolio(roi) {
  return `
    <div class="grid">
      <div>
        <p class="small">Paris placés</p>
        <h3>${roi.placedBets}</h3>
      </div>

      <div>
        <p class="small">En attente</p>
        <h3>${roi.pending}</h3>
      </div>

      <div>
        <p class="small">Profit</p>
        <h3>${roi.profit}</h3>
      </div>

      <div>
        <p class="small">ROI</p>
        <h3>${roi.roi}%</h3>
      </div>
    </div>
  `;
}