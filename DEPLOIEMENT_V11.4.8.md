# SportLab V11.4.8 — Evaluated Match Cleanup

## Objectif
Une rencontre qui a été évaluée après son coup d’envoi ne doit plus apparaître dans les analyses à effectuer, qu’elle ait été analysée ou non et qu’un pari ait été placé ou non.

## Changements
- ajout d’un registre transversal `evaluatedMatchRegistry` fondé en priorité sur le dataset d’apprentissage évalué ;
- filtrage des rencontres évaluées dans NFL Totals, FrenchFlair et DrawHunter ;
- mêmes exclusions dans les compteurs et le bouton de reprise du dashboard ;
- aucune suppression des historiques : les données restent disponibles dans Performances, Calibration, Journal et Paris.

## Déploiement
Remplacer le contenu du dépôt GitHub Pages par le contenu de cette archive.

Aucune modification du Worker Cloudflare n’est nécessaire. Bridge inchangé : 3.11.0.
