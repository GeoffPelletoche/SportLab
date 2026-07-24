# Sprint 7.1.2C — Cloud Recovery & Conflict Center

## Objectif

Compléter la Cloud Foundation avec une interface utilisateur de récupération, de comparaison et de suivi des conflits, sans modifier les moteurs métier ni le moteur de règlement des paris.

## Livré

- page **Recovery** accessible depuis la navigation et le Cloud Dashboard ;
- snapshots locaux automatiques avant les opérations sensibles ;
- comparaison non destructive des états Local / Cloud ;
- restauration Cloud vers Local ;
- sauvegarde volontaire Local vers Cloud ;
- fusion intelligente via la stratégie LWW du Sync Engine V2 ;
- restauration d’un snapshot local avec snapshot de sécurité préalable ;
- journal persistant des opérations Recovery ;
- historique persistant des conflits résolus automatiquement ;
- confirmations avant les opérations de remplacement ;
- interface responsive mobile et desktop.

## Stockage local technique

- `sportlab.v7.cloud.recovery.snapshots`
- `sportlab.v7.cloud.recovery.journal`
- `sportlab.v7.cloud.recovery.conflicts`

Les snapshots sont limités aux 20 plus récents, le journal et les conflits aux 100 plus récents.

## Garanties

Le Sprint 7.1.2C orchestre les API cloud existantes. Il ne modifie ni les moteurs DrawHunter/FrenchFlair, ni le settlement engine, ni la structure des données métier synchronisées.
