# Sprint 5.2 — Workflow DrawHunter

## Livré

- états UI persistants par match ;
- journal chronologique local ;
- actions contextuelles Commencer, Terminer, Historique et Archiver ;
- filtres Tous, Nouveaux, À analyser, VALUE, Paris, Résultats et Archives ;
- mémorisation du filtre, du panneau ouvert et de la position de défilement ;
- cartes évolutives selon le statut ;
- enregistrement du passage au statut Pari enregistré lors d’une sauvegarde.

## Persistance

Le workflow utilise `localStorage` avec la clé `sportlab_drawhunter_workflow_v1`. Le contexte de navigation utilise `sessionStorage`.

## Invariants

Aucun calcul de probabilité, VALUE, settlement, API ou moteur métier n’a été modifié.
