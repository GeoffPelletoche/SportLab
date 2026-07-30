# SportLab V8 — Historique multi-saisons pondéré par ancienneté

## Objectif

Supprimer la rupture statistique entre deux saisons et garantir un historique exploitable au démarrage d'une compétition.

## Modèle commun

- jusqu'à 30 matchs terminés par équipe ;
- tri du plus récent au plus ancien ;
- poids exponentiel `0,97^(rang-1)` ;
- poids plancher de `0,40` ;
- moyenne, sigma et fréquences calculés avec ces poids ;
- taille d'échantillon effective exposée au moteur de confiance.

## FrenchFlair

Le Worker remonte sur quatre saisons au maximum jusqu'à obtenir le volume cible. Les moyennes offensives, défensives, le total moyen et le sigma deviennent pondérés. La tendance Over/Under et la confiance utilisent ce nouvel historique.

## DrawHunter

Une nouvelle route Worker `/football/team-fixtures` récupère les 30 derniers matchs terminés d'une équipe. La probabilité de nul combine : fréquence pondérée des nuls, fréquence des matchs à faible score et équilibre attaque/défense.

## Déploiement

1. Déployer `cloudflare-worker/sportlab-api-bridge-v3.8.0.js` dans le Worker API Bridge.
2. Vérifier `/version` : `3.8.0`.
3. Déployer ensuite le projet SportLab V8 sur GitHub Pages.
4. Effectuer une synchronisation complète.

Les espaces de cache `rugby:v8:team-games` et `football:v8:team-fixtures` évitent la réutilisation des historiques V7.
