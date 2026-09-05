# SportLab V11.3.10 — Cloud & API-Sports Rate Protection

## Objectif
Corriger deux incidents indépendants observés en production : verrouillage Cloud trop large et rafale de requêtes API-Sports Football.

## Cloud Sync
- Le reset quotidien D1 n’est appliqué que si le Worker Cloud renvoie `d1_daily_quota_exceeded`.
- Un message générique contenant « quota » ne suffit plus.
- Une protection V11.3.9 héritée sans code explicite est automatiquement libérée afin de retester le Worker.
- Le circuit breaker non-D1 reste actif après erreurs consécutives et conserve son backoff court.

## API-Sports Football
Le Bridge 3.10.1 sérialise les appels sortants avec une marge volontaire : environ 3,6 appels/s et un budget interne de 240 appels/min. En cas de réponse rate-limit, il effectue deux retries différés au maximum et renvoie ensuite un HTTP 429 structuré `API_SPORTS_RATE_LIMIT`.

Le client SportLab réduit également la concurrence de chargement des historiques de 3 à 2 et ne relance plus automatiquement les erreurs HTTP 4xx/429.

## Recovery Center
Un bouton permet d’effacer uniquement les anciens conflits déjà résolus et leurs entrées de journal. Les données métier, snapshots, analyses, paris et la file Sync V2 restent intacts.

## Invariants préservés
- Fenêtre d’analyse : 1 jour.
- Modèle DrawHunter : inchangé.
- Modèle FrenchFlair : inchangé.
- Bet Store / settlement / learning / calibration : inchangés.
