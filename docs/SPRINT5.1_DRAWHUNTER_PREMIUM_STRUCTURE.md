# Sprint 5.1 — Structure DrawHunter Premium V2

## Objectif

Transformer la vue DrawHunter en atelier d’analyse Premium sans modifier le moteur métier.

## Livré

- Hero DrawHunter avec synthèse de la journée ;
- KPI : matchs, à traiter, VALUE et progression ;
- pipeline visuel Nouveau → Analyse → Décision → Suivi ;
- espace de travail en cartes Premium ;
- probabilité du nul mise au centre de chaque carte ;
- indicateur de confiance strictement visuel ;
- timeline structurelle par rencontre ;
- colonne latérale avec priorité et cadre d’analyse ;
- responsive desktop, tablette et iPhone ;
- suppression de toute référence visible à un bookmaker précis.

## Positionnement fonctionnel

DrawHunter reste centré sur le **match nul**.

La **Double Chance** est uniquement présentée comme marché dérivé lorsqu’elle est pertinente.

## Fichiers

```text
ui/views/drawhunterView.js
assets/drawhunter-premium-v2.css
index.html
```

## Invariants conservés

- moteur DrawHunter inchangé ;
- value engine inchangé ;
- probabilités inchangées ;
- décisions inchangées ;
- store des paris inchangé ;
- settlement engine inchangé ;
- API football inchangée.

## Remarque sur la confiance

En l’absence d’un champ `confidence` fourni par le payload, la jauge reprend visuellement la probabilité disponible. Cette valeur ne participe à aucun calcul ni aucune décision.
