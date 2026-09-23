# SportLab V11.4.12 — DrawHunter Match Identity Fix

## Correction
DrawHunter enregistrait encore un pari à partir de l’index visuel de la carte. Depuis le filtrage automatique des rencontres déjà évaluées, cet index pouvait ne plus correspondre à l’index du tableau API complet.

Conséquence : en cliquant sur une rencontre future, `saveDrawHunterBet()` pouvait récupérer une ancienne rencontre déjà commencée et afficher à tort :

`Le match a commencé : l’analyse et le pari sont désormais en lecture seule.`

La sauvegarde utilise désormais l’identifiant stable `matchId` de la rencontre affichée.

## Non modifié
- modèle DrawHunter et probabilité de nul ;
- calcul VALUE ;
- FrenchFlair ;
- NFL Totals ;
- settlement ;
- Performances / Calibration ;
- Cloud Sync / Tombstone Guard ;
- Bridge 3.11.0.
