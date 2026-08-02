# SportLab V11.1 — Explainable AI DrawHunter

Cette version ajoute un bloc d’explication uniquement dans DrawHunter.

Les explications utilisent exclusivement les données déjà produites par le moteur :

- taux pondéré de matchs nuls ;
- fréquence pondérée des matchs à faible score ;
- équilibre attaque / défense ;
- fiabilité de l’échantillon historique ;
- comparaison entre la cote bookmaker et la cote juste du modèle.

Le bloc explicatif ne modifie jamais la probabilité, la confiance, la value ou la décision.
FrenchFlair reste inchangé, conformément au périmètre validé.
