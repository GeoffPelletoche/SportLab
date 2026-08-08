# SportLab V11.3.1 — Settlement & Reopen Analysis

## Objectifs

Cette version corrige deux comportements observés en production :

1. Les paris DrawHunter restaient en attente après la fin des rencontres.
2. Une analyse sauvegardée ne pouvait plus être réévaluée avant le coup d'envoi lorsque la cote bookmaker évoluait.

## Règlement DrawHunter

Le moteur de règlement automatique prend désormais en charge :

- `rugby` via `/rugby/game-result` ;
- `football` via `/football/game-result` ;
- le marché `DRAW` de DrawHunter ;
- les marchés `OVER` et `UNDER` de FrenchFlair.

Les résultats football sont normalisés dans le même format que le Bets Store afin que le Journal, les performances, le Passive Learning Engine et le Calibration Engine puissent exploiter le règlement.

## Réouverture avant match

Une analyse `VALUE` ou `NO VALUE` reste accessible jusqu'au coup d'envoi si aucun pari n'a encore été placé.

L'utilisateur peut :

- rouvrir l'analyse ;
- modifier la cote bookmaker ;
- modifier la ligne FrenchFlair ;
- recalculer la VALUE ;
- placer finalement un pari si les nouvelles conditions deviennent intéressantes.

Au coup d'envoi, l'analyse et les données de pari passent en lecture seule.

## Cohérence du Bet Store

Une entrée `NON_PLACED` existante peut être transformée en pari `PENDING` avant le match sans créer de doublon.

## Worker

Aucune modification du Worker Cloudflare n'est nécessaire. La route `/football/game-result` existe déjà dans API Bridge 3.10.0.
