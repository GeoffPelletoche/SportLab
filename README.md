# SportLab

**Version : 8.0.1 — Navigation et fiabilité des données**

Projet complet SportLab intégrant le Sprint 7.1.2A.

## Correctif V8.0.1

Cette version allège les pages FrenchFlair et DrawHunter en supprimant le grand bloc de recherche/tri/filtres. Elle sécurise aussi les historiques grâce à une reprise locale de la dernière réponse valide et remplace les anciens diagnostics de règlement par une vue complète des données métier.


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


## Cloud Dashboard
La page Cloud présente le statut du Sync Engine V2, la file hors ligne, les dernières opérations et les commandes utilisateur. Les détails techniques restent dans Diagnostics.


## Cloud Recovery & Conflict Center

La page **Recovery** permet de comparer Local/Cloud, restaurer le cloud, sauvegarder le local, lancer une fusion intelligente et restaurer les snapshots locaux. Voir `docs/SPRINT7.1.2C_CLOUD_RECOVERY_CONFLICT_CENTER.md`.

## Sprint 7.2.0

SportLab inclut désormais un scoring commun DrawHunter/FrenchFlair, une confiance 0–100, une page de performances des modèles et une collecte passive versionnée pour préparer un futur apprentissage supervisé. Voir `docs/SPRINT7.2.0_UNIFIED_SCORING_MODEL_PERFORMANCE.md`.

## SportLab V8

SportLab V8 utilise désormais un historique glissant multi-saisons de 30 matchs, pondéré selon l'ancienneté réelle des rencontres. Le même moteur temporel alimente FrenchFlair et DrawHunter. Voir `docs/SPORTLAB_V8_RECENCY_WEIGHTED_MULTI_SEASON.md`.
