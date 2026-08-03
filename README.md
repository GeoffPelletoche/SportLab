# SportLab V11.1

**Version : 7.1.2C — Cloud Dashboard** V7.1.2A — Sync Engine V2

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


## Cloud Dashboard
La page Cloud présente le statut du Sync Engine V2, la file hors ligne, les dernières opérations et les commandes utilisateur. Les détails techniques restent dans Diagnostics.


## Cloud Recovery & Conflict Center

La page **Recovery** permet de comparer Local/Cloud, restaurer le cloud, sauvegarder le local, lancer une fusion intelligente et restaurer les snapshots locaux. Voir `docs/SPRINT7.1.2C_CLOUD_RECOVERY_CONFLICT_CENTER.md`.

## Sprint 7.2.0

SportLab inclut désormais un scoring commun DrawHunter/FrenchFlair, une confiance 0–100, une page de performances des modèles et une collecte passive versionnée pour préparer un futur apprentissage supervisé. Voir `docs/SPRINT7.2.0_UNIFIED_SCORING_MODEL_PERFORMANCE.md`.

## SportLab V10.1.1

SportLab V8 utilise désormais un historique glissant multi-saisons de 30 matchs, pondéré selon l'ancienneté réelle des rencontres. Le même moteur temporel alimente FrenchFlair et DrawHunter. Voir `docs/SPORTLAB_V8_RECENCY_WEIGHTED_MULTI_SEASON.md`.


## V10 — Workflow automatique

Les analyses terminées passent automatiquement en attente du résultat. Après récupération du score officiel, SportLab évalue la prédiction et la classe dans l’historique, y compris lorsqu’aucun pari n’a été placé.


## V11.1 — Explainable AI DrawHunter

DrawHunter explique désormais les principaux facteurs de sa probabilité de nul, sans modifier le modèle. FrenchFlair reste inchangé.


## V11.2.0 — Passive Learning Engine

SportLab enregistre désormais chaque prédiction évaluée dans un Learning Store synchronisé. Le moteur sépare la qualité de la prédiction de la qualité de la décision, consolide les statistiques par module, compétition et facteur, et affiche sa maturité dans les diagnostics. Il reste strictement passif : aucune prédiction ni aucun poids du modèle n’est modifié automatiquement.


## V11.2.1 — Team Branding

Les cartes DrawHunter et FrenchFlair affichent désormais les logos officiels API-Sports à gauche ou à droite du nom des équipes. Les images sont chargées paresseusement, mises en cache par le navigateur et masquées proprement si un logo n’est pas disponible. Aucun appel API supplémentaire ni changement du Worker n’est requis.


## V11.3.0 — Calibration Engine

SportLab mesure désormais l’écart entre les probabilités annoncées et les résultats observés, globalement, par module, compétition et tranche de probabilité. Le moteur est strictement passif et ne modifie jamais les prédictions. Voir `docs/SPORTLAB_V11.3_ARCHITECTURE_REVIEW.md`.
