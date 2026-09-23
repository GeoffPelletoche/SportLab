# SportLab V11.4.7 — NFL Passive Evaluation Fix

## Objectif
Corriger le cas où un match NFL terminé restait affiché comme prédiction non évaluée dans Performances, avec 0 bonne abstention / 0 opportunité manquée.

## Cause corrigée
Le Bridge API 3.11.0 renvoie pour NFL `homeScore`, `awayScore` et `status`. Le moteur d’évaluation passive attendait `homePoints`, `awayPoints`, `totalPoints` et `isFinished`, et ignorait donc silencieusement le résultat NFL avant l’évaluation.

## Correctif
- Normalisation de la réponse `/nfl/game-result` dans `predictionEvaluationEngine.js`.
- Reconnaissance des statuts terminés `FT`, `AOT`, `CLOSED` et `FINAL`.
- Calcul automatique de `totalPoints`.
- Si aucun pari/décision NFL n’a été enregistré avant le coup d’envoi, l’absence de pari devient une abstention réelle pour les métriques de décision.
- Les snapshots NFL déjà présents mais non évalués restent éligibles : ils seront retraités automatiquement après déploiement.

## Déploiement
Remplacer le contenu du dépôt GitHub par le contenu de cette archive, comme pour les versions précédentes. Aucun changement Worker / Cloudflare n’est nécessaire.

## Vérification attendue
Au prochain lancement de SportLab, la prédiction NFL terminée doit passer de `0 évaluée(s)` à `1 évaluée(s)` et alimenter soit `Bonnes abstentions`, soit `Opportunités manquées` selon le résultat de la préconisation.
