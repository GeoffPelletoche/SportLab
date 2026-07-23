// SPORTLAB V7.0.0 — Sprint 7.1 Core Foundation
import { bootstrapSportLabV7 } from "./core/app/bootstrap.js";
import { startLegacyApplication } from "./legacyApp.js";

bootstrapSportLabV7({ startLegacyApplication }).catch(error => {
  console.error("[SportLab V7] Échec du bootstrap", error);
  const app = document.getElementById("app");
  if (app) {
    app.innerHTML = `<h1>🏟️ SportLab</h1><section class="card"><h2>Erreur Core V7</h2><p>${String(error?.message || error)}</p></section>`;
  }
});
