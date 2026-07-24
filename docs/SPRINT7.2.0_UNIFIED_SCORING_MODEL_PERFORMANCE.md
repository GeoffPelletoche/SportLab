# Sprint 7.2.0 — Unified Scoring & Model Performance

## Livré

- moteur de scoring commun DrawHunter / FrenchFlair ;
- confiance normalisée de 0 à 100 ;
- score unifié affiché dans chaque carte d'analyse ;
- page Performances avec réussite, ROI réel, profit et calibration ;
- collecte passive et versionnée des prédictions ;
- séparation stricte des performances DrawHunter et FrenchFlair ;
- aucune modification automatique des coefficients ;
- aucune modification des moteurs Value, ROI ou Bet Settlement.

## Stockage

- `sportlab.v7.modelPerformance.records`
- `sportlab.v7.learning.dataset`

## Versions de modèle

- DrawHunter : `DH-7.2.0`
- FrenchFlair : `FF-7.2.0`

## Validation

`npm run validate` : 8 tests réussis, 0 échec.
