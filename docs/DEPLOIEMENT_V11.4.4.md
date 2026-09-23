# SportLab V11.4.4 — NFL Full Platform Integration

Base : V11.4.3 stable.

## Évolution
- Calibration : bloc NFL Totals séparé de DrawHunter et FrenchFlair.
- Performances : métriques NFL séparées (prédictions, réussite, ROI réel, profit, calibration et qualité de décision).
- Learning passif : capture et évaluation automatique des prédictions NFL via `/nfl/game-result`.
- Journal : les analyses/paris NFL restent issus des stores unifiés et sont filtrables par sport/source/marché.
- Paris : les paris NFL utilisent le Bet Store unifié et bénéficient du branding/logos NFL.
- Team Branding : support officiel des logos `american-football` API-Sports.
- Modèle NFL versionné `NFL-TOTALS-11.4.1` dans le dataset d'apprentissage.

## Invariants préservés
- Bridge Cloudflare 3.11.0 inchangé.
- DrawHunter DH-11.3.4 inchangé.
- FrenchFlair inchangé.
- Cloud Sync / Tombstone Guard inchangés.
- Calibration et apprentissage restent strictement passifs : aucune modification automatique du modèle.
