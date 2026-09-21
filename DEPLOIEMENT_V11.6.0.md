# Déploiement SportLab V11.6.0 — Safe Recovery

## Objectif
Sécuriser la reprise Cloud sans modifier le Worker V7.0.4 ni les moteurs DrawHunter/FrenchFlair.

## Protections
- snapshot local automatique avant toute application Cloud qui modifierait le local ;
- si le snapshot ne peut pas être écrit (quota Safari), aucune donnée Cloud n’est appliquée ;
- anti-écrasement : une divergence locale non sûre est conservée et devient un conflit explicite ;
- suppression du Last-Write-Wins automatique lors des conflits HTTP 409 ;
- Recovery Center affiche `Décision requise` pour les conflits en attente ;
- le nettoyage des anciens conflits conserve les conflits encore en attente.

## Déploiement
Remplacer le contenu du dépôt GitHub Pages par cette archive complète. Ne pas modifier le Worker Cloudflare V7.0.4.
