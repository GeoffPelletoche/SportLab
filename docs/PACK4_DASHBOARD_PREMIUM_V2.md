# Pack 4 — Dashboard Premium V2

## Objectif

Transformer l’accueil SportLab en cockpit opérationnel mobile-first, sans modifier les moteurs métier.

## Nouveautés

- Hero de pilotage avec état global
- Priorités calculées à partir des données existantes
- Cartes DrawHunter et FrenchFlair enrichies
- KPI consolidés
- Actions rapides
- État détaillé des synchronisations
- Activité récente issue des paris existants
- Actualisation manuelle du Dashboard
- Interactions idempotentes
- Responsive mobile, tablette et desktop

## Fichiers principaux

```text
ui/views/dashboardView.js
ui/interactions/dashboardPremium.js
assets/dashboard-premium-v2.css
app.js
index.html
```

## Architecture

Le Dashboard reste une vue pure :
- aucune récupération API ;
- aucune écriture dans les stores ;
- aucune modification du settlement engine ;
- aucune décision métier ajoutée.

Les interactions sont isolées dans `dashboardPremium.js`.

## Initialisation

`app.js` contient désormais :

```js
function initializeUi() {
  initSportLabUi();
  initDashboardPremium();
}
```

Cette fonction est rappelée après chaque rendu complet.
