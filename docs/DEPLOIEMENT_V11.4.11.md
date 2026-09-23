# SportLab V11.4.11 — FrenchFlair VALUE Guard Fix

## Correction
FrenchFlair ne peut plus afficher `VALUE` lorsque la value mathématique ou l'edge est négatif.

La décision finale exige désormais simultanément :
- value mathématique >= +1 point de probabilité (`0.01`) ;
- edge / EV strictement positif ;
- probabilité SportLab supérieure à la probabilité implicite bookmaker ;
- score VALUE SportLab >= 70.

Le score qualitatif (écart modèle/bookmaker, confiance, sigma) reste inchangé, mais il ne peut plus à lui seul déclencher un pari VALUE.

## Non modifié
- moteur de projection FrenchFlair ;
- modèle NFL Totals ;
- DrawHunter ;
- settlement ;
- Performances / Calibration ;
- Cloud Sync / Tombstone Guard ;
- Bridge 3.11.0.
