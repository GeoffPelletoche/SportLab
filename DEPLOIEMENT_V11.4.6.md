# SportLab V11.4.6 — Startup Resilience

## Objectif
Supprimer les erreurs transitoires visibles à la première ouverture qui disparaissaient après un rafraîchissement manuel.

## Comportement
- Chaque sport reste chargé indépendamment.
- Au démarrage uniquement, un module en erreur est retenté automatiquement après 1,2 s puis 2,5 s.
- Les autres modules ne sont pas relancés.
- Pendant le retry, le dashboard affiche `Connexion…` plutôt que `Erreur`.
- Une erreur rouge n’apparaît qu’après l’échec des tentatives automatiques.

## Inchangé
- DrawHunter DH-11.3.4
- FrenchFlair
- NFL Totals NFL-TOTALS-11.4.1
- VALUE / settlement / calibration / performances
- Cloud Sync / Tombstone Guard
- API Bridge 3.11.0

## Déploiement
Remplacer le contenu du dépôt par le contenu de cette archive complète puis déployer GitHub Pages comme pour V11.4.5. Aucun changement Cloudflare n’est nécessaire.
