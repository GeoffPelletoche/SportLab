# SportLab V10.0.0 — Workflow automatique

## Cycle de vie

Nouvelle → À analyser → En attente du résultat → Évaluée → Historique.

- Une seule action utilisateur clôt l'analyse.
- L'action Archiver a été supprimée des cartes.
- Le résultat officiel déclenche l'évaluation automatique, avec ou sans pari.
- Les décisions NO VALUE sont classées en bonne abstention ou opportunité manquée.
- La page Performances affiche un indice de décision sur 100.
- Les anciennes valeurs de statut sont migrées automatiquement vers `awaiting_result`.
