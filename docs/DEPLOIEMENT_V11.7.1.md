# Déploiement SportLab V11.7.1 — API Request Scheduler

Remplacer le contenu du dépôt GitHub Pages par le contenu complet de cette archive.

## Correctif API-Sports
- ordonnanceur central Football + Rugby + NFL ;
- appels espacés de 900 ms ;
- fixtures prioritaires ;
- HTTP 429 : pause globale minimale de 15 s puis une reprise automatique ;
- aucun double rafraîchissement concurrent ;
- diagnostic `RATE_LIMITED` au lieu d'une fausse erreur de compétition.

## Inchangé
- Worker Cloud Sync V7.0.4 ;
- API Bridge ;
- moteurs DrawHunter, FrenchFlair et NFL Totals ;
- Safe Recovery ;
- logique VALUE / NO VALUE ;
- Atomic Background Refresh.
