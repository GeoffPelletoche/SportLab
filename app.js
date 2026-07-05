const app = document.getElementById("app");

function render() {
  app.innerHTML = `
    <h1>🏟️ SportLab</h1>

    <p>✅ Sprint 1 actif</p>
    <p>✅ App chargée correctement</p>
    <p>✅ Aucun module externe chargé pour l’instant</p>
  `;
}

render();