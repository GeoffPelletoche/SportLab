# Déploiement SportLab V11.3.11

## 1. Application GitHub Pages
Déployer l'intégralité de cette archive dans le dépôt SportLab, comme pour V11.3.9.

La mise à jour du front libère automatiquement une ancienne protection quota V11.3.9 qui n'était pas accompagnée du code D1 explicite `d1_daily_quota_exceeded`. Si D1 est réellement en quota, le Worker Cloud le confirmera et la protection sera recréée correctement.

## 2. Worker API-Sports Football
Le correctif de rafale Football nécessite aussi de mettre à jour le Worker séparé `sportlab-api-bridge` avec :

`cloudflare-worker/sportlab-api-bridge-v3.10.1.js`

La route `/version` doit ensuite répondre `3.10.1`.

Le Worker Cloud Sync D1 (`sportlab-cloud-sync`) reste en 7.1.3 : aucun redéploiement D1 n'est requis pour V11.3.11.

## 3. Vérification dans SportLab
Après mise à jour :
- ouvrir Cloud Dashboard ;
- utiliser « Synchroniser maintenant » une fois ;
- vérifier le code erreur affiché si la synchronisation échoue ;
- ne pas supprimer les 4 éléments de la file Sync V2 ;
- dans Recovery Center, le bouton « Nettoyer les anciens conflits » peut être utilisé pour effacer seulement l'historique des conflits résolus.

## Invariants
- fenêtre d'analyse : 1 jour ;
- DrawHunter/FrenchFlair : moteurs métier inchangés ;
- Bet Store, settlement, learning et calibration : inchangés.
