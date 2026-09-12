# SportLab V11.4.9 — NFL Placed Bet Cleanup

## Objectif
Lorsqu’un pari NFL est réellement placé, la rencontre quitte immédiatement l’atelier NFL Totals après sauvegarde.

## Correction
- NFL Totals filtre désormais les rencontres ayant déjà un pari `placed: true` dans le Bet Store unifié.
- Un pari NFL sauvegardé reste visible dans **Paris** et **Journal**.
- La rencontre reste disponible pour le settlement, **Performances** et **Calibration** après résultat.
- Une analyse sauvegardée sans pari n’est pas masquée avant le coup d’envoi.
- La correction VALUE locale de V11.4.8 est conservée.

## Inchangé
- moteurs DrawHunter, FrenchFlair et NFL Totals ;
- VALUE Guard / scoring ;
- settlement ;
- Cloud Sync / Tombstone Guard ;
- Bridge 3.11.0.

Aucun changement Cloudflare requis.
