# SportLab V6.3.6 — Pack 3

## Objectif
Migration des vues vers le Framework CSS Premium `.sl-*`, sans modification des moteurs métier.

## Fichiers migrés
- `index.html`
- `ui/views/navigationView.js`
- `ui/views/dashboardView.js`
- `ui/views/drawhunterView.js`
- `ui/views/frenchflairView.js`
- `ui/views/betsView.js`
- `ui/views/journalView.js`
- `ui/views/portfolioView.js`
- `ui/views/diagnosticsView.js`
- `assets/sportlab.css`

## Installation
Le projet fourni est déjà configuré avec :

```html
<link rel="stylesheet" href="./assets/style.css" />
<link rel="stylesheet" href="./assets/sportlab.css" />
```

Conserver les deux fichiers pendant ce Pack 3. `sportlab.css` est chargé en dernier.

## Sécurité
- Identifiants `id` conservés.
- Fonctions `onclick` conservées.
- Classes historiques conservées en double avec les classes `.sl-*`.
- Services, stores, API et moteurs non modifiés.

## Contrôles recommandés
1. Ouverture/fermeture du menu hamburger.
2. Navigation entre toutes les pages.
3. Dashboard sur mobile et bureau.
4. Saisie et validation des paris DrawHunter/FrenchFlair.
5. Journal, Portfolio et Diagnostics.
6. Persistance après actualisation.

## Suite
Le Pack 4 pourra supprimer progressivement les règles historiques uniquement après validation visuelle et fonctionnelle.
