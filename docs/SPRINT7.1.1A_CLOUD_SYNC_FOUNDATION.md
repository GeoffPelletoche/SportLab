# Sprint 7.1.1A — Cloud Sync Foundation

## Objectif

Créer l’infrastructure cloud indépendante de SportLab V7 : API Cloudflare Worker, base D1, authentification mono-utilisateur, appareils, journal de changements et endpoints de synchronisation.

## Périmètre livré

- Worker JavaScript sans framework ;
- schéma D1 versionné par migration SQL ;
- bootstrap sécurisé et création d’un jeton utilisateur ;
- enregistrement multi-appareils ;
- push optimiste avec `baseVersion` et réponse de conflit HTTP 409 ;
- pull incrémental par curseur ;
- snapshot complet de restauration ;
- CORS strict ;
- mode local avec Wrangler ;
- tests de fumée Node.

## Hors périmètre

L’application SportLab n’envoie encore aucune donnée au Worker. Le `localStorage` reste la source de vérité jusqu’au Sprint 7.1.1B, qui ajoutera le Sync Engine, la migration initiale et l’interface de connexion.

## Modèle de conflit

Chaque enregistrement possède une version serveur. Le client envoie sa `baseVersion`. Si elle ne correspond plus à la version courante, le serveur refuse uniquement cet enregistrement et renvoie l’état actuel. Aucun écrasement silencieux n’est effectué.

## Données

Le stockage est générique (`namespace` + `record_key` + JSON). Il peut recevoir les domaines DrawHunter, FrenchFlair, bets, workflow, history et settings sans dupliquer le moteur métier dans le Worker.
