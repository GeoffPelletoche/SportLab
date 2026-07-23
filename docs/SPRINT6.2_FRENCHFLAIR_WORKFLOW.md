# Sprint 6.2 — Workflow FrenchFlair

Version : SportLab V6.5.1

## Objectif
Ajouter un workflow persistant aux rencontres FrenchFlair sans modifier les moteurs de projection, de probabilité, de VALUE ou de règlement.

## Fonctions livrées
- États persistants : Nouveau, À analyser, Analyse terminée, Décision prise, VALUE, Pari enregistré, Résultat, Archivé.
- Journal chronologique local par rencontre.
- Actions contextuelles : commencer, continuer, terminer, détails, historique et archiver.
- Filtres Premium par état.
- Restauration du filtre, du défilement et des panneaux ouverts.
- Mise à jour automatique du workflow lors de la sauvegarde d’une analyse ou d’un pari.

## Stockage
- localStorage : `sportlab_frenchflair_workflow_v1`
- sessionStorage : `sportlab_frenchflair_context_v1`

## Compatibilité
Le moteur FrenchFlair, les stores d’analyses et de paris, l’API Rugby et le settlement engine restent inchangés.
