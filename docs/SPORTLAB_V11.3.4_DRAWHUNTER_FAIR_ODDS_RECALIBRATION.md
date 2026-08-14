# SportLab V11.3.4 — DrawHunter Fair Odds Recalibration

## Objectif
Corriger la surévaluation de la probabilité de match nul observée dans le modèle précédent.

## Ancienne logique
La formule additionnait un socle fixe et trois contributions positives importantes : taux de nuls, profil faible score et équilibre. Des indicateurs corrélés pouvaient donc faire passer un taux de nuls historique d'environ 33 % à une probabilité finale proche de 48 %.

## Nouvelle logique
- socle = taux de nuls pondéré ;
- léger shrinkage vers 28 % lorsque l'échantillon effectif est limité ;
- ajustement faible score borné à ±2,5 points ;
- ajustement équilibre borné à ±2 points ;
- probabilité finale bornée entre 20 % et 40 % ;
- cote juste = 1 / probabilité finale.

Aucune cote minimale n'est imposée : un match au profil exceptionnel peut conserver une cote juste inférieure à 3.00.

## Versionnage
Le modèle DrawHunter devient `DH-11.3.4` afin que Passive Learning et Calibration puissent distinguer les observations du modèle précédent.
