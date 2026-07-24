# SportLab V7.1.2A — Sync Engine V2

Projet complet SportLab intégrant le Sprint 7.1.2A.

## Nouveautés principales

- synchronisation automatique au démarrage, après modification, au retour en ligne et périodiquement ;
- file hors ligne persistante V2 avec déduplication, tentatives et backoff exponentiel ;
- synchronisation différentielle des seules clés localStorage modifiées ;
- reprise automatique lorsqu'une demande survient pendant une synchronisation active ;
- push par lots de 250 éléments, compatible avec le contrat Worker ;
- résolution de conflits Last-Write-Wins centralisée et journalisée ;
- événements `sync:*` pour découpler les modules du backend ;
- diagnostics enrichis dans `SportLabCore.cloud.status()` ;
- nettoyage complet des listeners lors de l'arrêt du moteur.

## Validation locale

À la racine :

```powershell
npm run validate
```

Pour le Worker :

```powershell
cd cloudflare-worker
npm install
npm run check
npm test
```

## Déploiement

Le frontend reste déployable via GitHub Pages. Le Worker peut être redéployé avec Wrangler ; aucun nouveau schéma D1 n'est requis pour ce sprint.
