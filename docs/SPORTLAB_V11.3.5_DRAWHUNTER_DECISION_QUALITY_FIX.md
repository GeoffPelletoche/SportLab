# SportLab V11.3.5 — DrawHunter Decision Quality Fix

## Problème

Les prédictions DrawHunter étaient correctement évaluées, mais les compteurs **Bonne abstention** et **Opportunité manquée** restaient à zéro.

La cause était architecturale : la qualité de décision était calculée depuis `snapshot.modelDecision`, souvent capturé avant la saisie de la cote bookmaker. La décision réellement sauvegardée dans le workflow DrawHunter (`VALUE BET` ou `NO BET`) n'était donc pas utilisée.

## Correction

- La page Performances reconstruit la décision depuis les sources persistées, dans cet ordre : workflow, analyse, Bet Store, puis ancien snapshot.
- Les anciennes évaluations déjà stockées sont corrigées à l'affichage lorsqu'un workflow explicite existe.
- Les futures évaluations utilisent la décision réellement sauvegardée avant d'écrire dans le Passive Learning Store.
- Une rencontre jamais traitée n'est plus assimilée automatiquement à une décision VALUE.
- La fenêtre d'analyse demandée précédemment reste fixée à 3 jours.

## Worker

Aucun changement du Worker Cloudflare 3.10.0.
