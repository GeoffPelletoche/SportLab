# V11.3.16 — Progressive Sports Loading & Performance Fix

- Séparation complète des chargements Football et Rugby.
- Publication progressive des fixtures avant la fin des historiques.
- Cache historique prioritaire ; appels API uniquement pour les historiques manquants.
- Rafraîchissement automatique de la vue active à chaque étape utile.
- Correction de la route Performances (`performance` / `model-performance`).
- Aucun changement du Cloud Sync, Tombstone Guard, modèles métier ou fenêtre J+1.
- Validation : 98/98 tests.

# V11.3.15 — Cloud Bootstrap & Performance Fix

- Cloud Sync initialisé avant les chargements Football/Rugby.
- `window.SportLabCore` et les commandes Cloud sont disponibles dès l'affichage local.
- Les rafraîchissements Cloud/Recovery ne relancent plus le chargement sportif complet.
- Conserve le Tombstone Guard V11.3.12 et les optimisations iOS/navigation V11.3.13.


## V11.3.15 — iOS UX & Navigation Performance
- iOS: tous les champs de saisie interactifs utilisent au moins 16 px pour empêcher le zoom automatique au focus, sans désactiver le zoom utilisateur.
- Fast Start: l’interface et les données locales s’affichent avant la fin des chargements Football/Rugby.
- Fast Navigation: les changements Accueil / DrawHunter / FrenchFlair / Cloud réutilisent les données en mémoire et ne relancent plus les API, le settlement ou l’évaluation des prédictions.
- Toutes les protections Sync Tombstone Guard V11.3.12 sont conservées.
# V11.3.15 — Clean Start + Sync Safety

## V11.3.15 — Sync Tombstone Guard
- Purge automatique des tombstones implicites/anciens de la file Sync V2 avant push.
- Le scan local automatique ne génère plus jamais de suppression Cloud.
- Les suppressions en file exigent désormais une intention explicite `explicit-user-delete`.
- Les tombstones Cloud deviennent autoritaires lors de tout conflit.
- Correctif ciblé du scénario iPhone observé pendant le Clean Start V11.3.11.


- Sécurité Cloud Sync : une clé `localStorage` absente n'est plus convertie automatiquement en tombstone Cloud.
- Un navigateur/profil vierge ne peut donc plus supprimer analyses, paris, workflows, réglages ou learning du Cloud par simple absence locale.
- Protection anti-résurrection : lors d'un conflit, un tombstone Cloud dont la version est plus récente que la `baseVersion` connue par l'appareil est autoritaire.
- Conservation des protections V11.3.10 : polling 5 min, onglets masqués ignorés, stabilité des timestamps de queue, circuit breaker D1 et protections API-Sports.
- Aucun changement du modèle DrawHunter (`DH-11.3.4`), de FrenchFlair, du settlement, de la fenêtre d'analyse 1 jour ou du correctif zoom iOS.

# V11.3.6 — FrenchFlair : masquer les paris placés

- Aligne le comportement FrenchFlair sur DrawHunter : dès qu’un pari est réellement placé, la rencontre n’est plus affichée dans l’atelier d’analyse.
- La rencontre reste disponible dans Paris et Journal et continue d’être suivie par le moteur de règlement.
- Les analyses sans pari, y compris NO VALUE, restent visibles et modifiables jusqu’au coup d’envoi.
- Fenêtre d’analyse conservée à J+1.
- Aucun changement du Worker Cloudflare.

# V11.3.5 — DrawHunter Decision Quality Fix

- Corrige les compteurs Bonnes abstentions / Opportunités manquées dans Performances.
- Reconstruit la décision réelle depuis le workflow, les analyses et le Bet Store.
- Corrige aussi les futures évaluations du Passive Learning Engine.
- Conserve la fenêtre d’analyse à J+3.
- Aucun changement du Worker Cloudflare.

# SportLab V11.3.3 — Simplification UX Dashboard & Pipeline DrawHunter

- Correction du pipeline DrawHunter pour utiliser les statuts workflow V10/V11 (`new`, `pending`, `awaiting_result`, `resulted`, `archived`).
- Le nombre « À analyser » reflète désormais les rencontres réellement encore à traiter.
- Suppression du scoreboard redondant dans l’en-tête DrawHunter.
- Suppression du bloc « Priorités » de l’accueil.
- Suppression de la section « Vue d’ensemble » redondante.
- Suppression des compteurs VALUE de l’accueil et des cartes modules.
- Le cockpit affiche simplement le nombre de matchs disponibles, sans message « aucune opportunité ».
- Les cartes modules utilisent les états workflow pour leur compteur « À analyser ».

## V11.3.10 — Protection Cloud stricte + rate limiter API-Sports Football

- Base : V11.3.9 validée et déployée.
- Fenêtre d’analyse conservée à **1 jour**.
- Cloud Sync : une suspension jusqu’au reset D1 ne peut désormais être déclenchée que par le code explicite `d1_daily_quota_exceeded`.
- Migration automatique : une ancienne protection quota V11.3.9 sans code D1 explicite est libérée au démarrage ; le Worker Cloud peut alors confirmer ou infirmer un vrai dépassement.
- Dashboard Cloud : affichage du code d’erreur et de la raison de protection.
- Recovery Center : ajout d’un nettoyage sécurisé de l’historique des conflits résolus, sans toucher aux analyses, paris ni à la file Sync V2.
- API Football : Bridge **3.10.1** avec file d’attente conservatrice (~3,6 req/s, budget 240/min), retries contrôlés sur rate-limit, réponses 429 structurées et distinction rate-limit / abonnement.
- DrawHunter : concurrence des historiques réduite de 3 à 2 pour lisser les rafales.
- Client API : plus de retries automatiques agressifs sur 4xx/429.
- Aucun changement du modèle DrawHunter, FrenchFlair, du scoring, du settlement ou du Bet Store.

## 11.3.2 — Performance Engine Fix
- Performances lit le Learning Store pour les prédictions évaluées et la qualité des décisions.
- ROI et profit proviennent exclusivement du Bet Store unifié.
- Suppression du balayage générique de localStorage dans la vue Performances.

## 11.3.1 — Settlement DrawHunter & analyses réouvrables

- Règlement automatique des paris DrawHunter via `/football/game-result`.
- Support du marché `DRAW` dans le Settlement Engine.
- Les analyses VALUE et NO VALUE restent réouvrables jusqu’au coup d’envoi si aucun pari n’est placé.
- Une variation de cote peut donc déclencher un nouveau calcul de VALUE avant match.
- Verrouillage des modifications au coup d’envoi.
- Transformation sans doublon d’une entrée `NON_PLACED` en pari `PENDING`.
- FrenchFlair et DrawHunter conservent les rencontres futures accessibles après sauvegarde.
- Worker Cloudflare inchangé : API Bridge 3.10.0.

## 11.3.0 — Calibration Engine

- Nouvelle page Calibration, distincte de Performances.
- Mesure globale, par module, compétition et tranche de probabilité.
- Indice basé sur l’erreur de calibration pondérée, avec garde-fous d’échantillon.
- Intégration au centre Diagnostics.
- Compatibilité avec les enregistrements Passive Learning V11.2.
- Aucun recalibrage ni changement automatique du modèle.

## 11.2.3 — Team Branding Recovery

- Logos Paris et Journal retrouvés par matchId ou par noms d’équipes.
- Correction des anciens enregistrements ne contenant pas homeId/awayId.

## 11.1.2 — Unified Bet Store

- Correction du Journal qui ignorait les paris DrawHunter sans entrée analysisStore.
- Source unique `sportlab_bets_v3`, migration et déduplication automatiques.
- Mises en attente et nombre de paris calculés depuis le même store que DrawHunter et FrenchFlair.

## V11.1.0 — Explainable AI DrawHunter

- Explications du modèle uniquement dans DrawHunter.
- Cinq facteurs interprétables, dont la comparaison cote bookmaker / cote juste.
- Aucun changement du moteur de prédiction ou de FrenchFlair.

# Changelog

## V11.3.9 — Correctif boucle de conflits / quota D1

- Empêche `enqueue()` de réinitialiser le backoff lorsqu'un changement possède le même fingerprint.
- Stabilise le `clientUpdatedAt` d'une modification locale tant qu'elle n'est pas acquittée.
- Diffère les réessais après conflit (1 min → 5 min → 15 min → 1 h) au lieu de relancer immédiatement.
- Déduplique les entrées identiques du Recovery Center pour éviter de remplir le journal avec le même conflit.
- Ajoute un circuit breaker cloud après plusieurs erreurs consécutives et suspend les appels jusqu'au prochain reset UTC en cas de quota D1 quotidien atteint.
- Conserve le correctif V11.3.8 de réduction de fréquence à 5 min, d'absence d'appel `me()` à chaque sync et de no-op D1.
- Fenêtre d'analyse conservée à 1 jour.


## 10.1.2

- Suppression de la cote DrawHunter simulée à 3,10.
- Ajout de la saisie manuelle de la cote bookmaker du match nul.
- Recalcul instantané de la probabilité implicite, de la value, de l’edge et de la décision.
- Persistance de la cote et du calcul dans le workflow de la rencontre.
- Affichage automatique du formulaire de pari uniquement lorsqu’une VALUE est détectée.
- Validation obligatoire d’une cote supérieure à 1,00 avant de terminer l’analyse.

## 10.1.1

- DrawHunter reste ouvert après « Terminer l’analyse ».
- Passage automatique à la prochaine analyse disponible.
- Message de confirmation avec le nombre d’analyses restantes.
- Aucun rechargement complet de la page lors du changement de statut.

## 10.1.0

- Stabilisation du pipeline DrawHunter.
- Détection automatique de la saison football dans le Worker 3.10.0.
- Distinction entre compétition sans match et erreur API.
- Diagnostic détaillé par compétition avec code HTTP et cause probable.
- Cache court pour les périodes sans rencontre.

# 10.0.0

- Cycle automatique des analyses : nouvelle, à analyser, attente du résultat, évaluée, historique.
- Suppression de l’action manuelle Archiver.
- Évaluation automatique de toutes les prédictions, y compris NO VALUE sans pari.
- Bonnes abstentions et opportunités manquées.
- Indice de décision sur 100 dans les performances.
- Migration transparente des anciens statuts.

# Changelog

## 9.0.0

- Fiabilisation des historiques multi-saisons rugby et football.
- Évaluation automatique des prédictions sans pari.
- Diagnostics opérationnels V9.
- Navigation mobile simplifiée.
- Worker API Bridge 3.9.0.

# SportLab V7.1.2C — Cloud Recovery & Conflict Center

- Ajout du Recovery Center et de sa navigation dédiée.
- Snapshots locaux de sécurité et restauration.
- Comparaison Local / Cloud non destructive.
- Sauvegarde forcée Local vers Cloud et restauration Cloud vers Local.
- Fusion intelligente LWW, journal Recovery et historique des conflits.
- Tests automatisés du Recovery Center.

# Changelog

## V7.1.2A — Sync Engine V2

- Queue hors ligne persistante V2 avec déduplication, retry et backoff exponentiel.
- Diff Engine et synchronisation automatique multi-déclencheurs.
- Verrou de synchronisation avec second passage garanti.
- Push par lots et acquittement granulaire.
- Résolution Last-Write-Wins centralisée avec événements de conflit.
- Diagnostics et événements Sync V2.
- Version frontend/Worker harmonisée.

## 7.0.0 — Sprint 7.1 Core Foundation

- Nouveau bootstrap V7 placé avant le runtime historique.
- Ajout du registre de modules et des définitions DrawHunter/FrenchFlair.
- Ajout du bus d’événements, du cycle de vie et du routeur fondation.
- Ajout d’un adaptateur de stockage et de migrations non destructives.
- Ajout d’un store de réglages, d’un moteur de thème et de densité.
- Ajout de services communs de notification, dialogue et diagnostic.
- Encapsulation de la V6.5.3 dans `legacyApp.js`.
- Aucun moteur métier ou algorithme VALUE modifié.

## V6.5.2 — Sprint 6.3 FrenchFlair Premium UX

- Refonte de la hiérarchie mobile FrenchFlair.
- Hero compact et signal décisionnel prioritaire.
- KPI synthétiques.
- Rencontres affichées avant les blocs pédagogiques.
- Cockpit et méthode repliables.
- Filtres workflow sticky et cohérents avec le thème sombre.
- Optimisation des cartes et actions sur iPhone.
- Moteurs et workflow Sprint 6.2 préservés.

## V6.5.1 — Sprint 6.2 FrenchFlair Workflow

- Ajout du workflow persistant FrenchFlair.
- Ajout du journal par rencontre et des actions contextuelles.
- Ajout des filtres Premium par état.
- Restauration du contexte utilisateur.
- Synchronisation du workflow avec les analyses et paris sauvegardés.
- Aucun changement des moteurs métier.

## V6.5.0 — Sprint 6.1 : FrenchFlair Premium

### Ajouté
- Hero et scoreboard FrenchFlair.
- KPI de couverture, total modèle, sigma et confiance.
- Cockpit latéral et signal de tendance.
- Cartes Premium Over/Under avec projections et détails repliables.
- Feuille de style responsive dédiée.
- Documentation et checklist Sprint 6.1.

### Conservé
- Moteurs rugby, calcul VALUE, API, stockage, synchronisation et settlement.

— SportLab V6.3.7 Pack 3

## Ajouté
- Bibliothèque CSS de composants Premium
- Helpers de rendu HTML
- Tabs accessibles au clavier
- Modal avec focus trap
- Toasts sans dépendance externe
- Galerie de composants
- Catalogue et checklist de validation

## Non modifié
- Moteurs DrawHunter et FrenchFlair
- Services
- Stores
- Settlement engine
- Données utilisateur


## V6.3.7 — Pack 4 Dashboard Premium V2
- Nouveau cockpit d’accueil
- Priorités dynamiques
- Modules enrichis
- KPI consolidés
- Actions rapides
- Activité récente
- Synchronisation détaillée
- Initialisation UI centralisée


## V6.3.8 — Pack 4.1 Desktop Cockpit
- meilleure occupation des écrans PC
- priorité unique pleine largeur
- grille desktop étendue
- palier tablette/ordinateur intermédiaire
- rendu mobile conservé

- clarification : DrawHunter centré sur l’analyse du match nul
- Double Chance présentée comme marché dérivé si pertinente
- bouton principal orienté automatiquement vers le module prioritaire


## V6.4.0 — Sprint 5.1 DrawHunter Premium V2
- nouveau Hero et scoreboard DrawHunter ;
- pipeline visuel d’analyse ;
- cartes Premium et timeline structurelle ;
- responsive desktop / tablette / iPhone ;
- libellés bookmaker neutralisés ;
- logique métier conservée.

## V6.4.1 — Sprint 5.2 Workflow DrawHunter
- workflow UI persistant ;
- journal par rencontre ;
- actions contextuelles ;
- filtres Premium ;
- restauration du contexte ;
- moteurs métier inchangés.


## V6.4.2 — Sprint 5.3 / Clôture Pack 5
- recherche instantanée et tris multicritères ;
- densité Confort / Compact ;
- détails repliables et navigation clavier ;
- contexte complet restauré ;
- KPI de workflow corrigés ;
- optimisation du rendu et compatibilité renforcée ;
- Pack 5 officiellement clôturé ;
- moteurs métier inchangés.

## V6.5.3 — Sprint 6.4 / Clôture officielle du Pack 6

### Ajouté
- Recherche instantanée par équipe et compétition dans FrenchFlair.
- Tri par date, confiance, total modèle, sigma, VALUE et workflow.
- Densités d’affichage Confort et Compact.
- KPIs VALUE, paris suivis, décisions en attente et résultats.
- Persistance en session de la recherche, du tri, du filtre et de la densité.

### Optimisé
- Mise à jour du workflow sans `location.reload()`.
- Tri et filtrage directement dans le DOM.
- Écouteur de scroll unique avec `AbortController`.
- Responsive iPhone du centre de contrôle.

### Documentation
- Manifest consolidé en V6.5.3.
- Documentation et validation Sprint 6.4.
- Pack 6 officiellement clôturé.

### Non modifié
- Moteurs statistiques Rugby.
- API Rugby.
- Calcul VALUE.
- Settlement engine.

## 7.0.1 — Sprint 7.1.1A Cloud Sync Infrastructure

### Ajouté
- API Cloudflare Worker indépendante de l’application.
- Schéma Cloudflare D1 versionné.
- Bootstrap mono-utilisateur protégé par secret.
- Jetons Bearer persistés uniquement sous forme de hash.
- Registre des appareils.
- Push optimiste, pull incrémental et snapshot complet.
- CORS limité aux origines explicitement autorisées.
- Documentation de déploiement dash.cloudflare.com et Wrangler.
- Tests de fumée du Worker.

### Préservé
- Runtime SportLab V7 Core.
- Moteurs DrawHunter et FrenchFlair.
- Données locales existantes.

### Important
- Le cloud n’est pas encore la source de vérité du client. Le branchement et la migration locale seront réalisés au Sprint 7.1.1B.

## 7.0.2 — Sprint 7.1.1B Cloud Integration
- Cloudflare D1 devient la source de vérité des données SportLab.
- Ajout Sync Engine, file hors ligne, migration initiale, push/pull, statut Cloud et connexion multi-appareils.
- Ajout des routes backend backup/restore.

## 7.1.2B — Cloud Dashboard
- Ajout d'une page Cloud dédiée dans la navigation.
- Visualisation de l'état du Sync Engine V2, de la file, des push/pull et des conflits.
- Ajout des commandes de synchronisation manuelle et d'accès aux paramètres cloud.
- Conservation de la séparation entre informations utilisateur et diagnostics techniques.
- Aucun changement du settlement engine ni des moteurs métier.

## 7.2.0 — Unified Scoring & Model Performance

- Ajout d'un moteur de scoring unifié pour DrawHunter et FrenchFlair.
- Ajout d'un indice de confiance normalisé de 0 à 100.
- Ajout du score unifié dans les cartes d'analyse.
- Nouvelle page Performances des modèles.
- Suivi du taux de réussite, du ROI réel, du profit et de la calibration.
- Collecte passive de snapshots versionnés pour un futur apprentissage supervisé.
- Aucun classement prioritaire, aucune explication automatique et aucun nouveau seuil Value.
- Aucun auto-apprentissage actif.

## 8.0.0 — Recency Weighted Multi-Season

- moteur temporel commun DrawHunter/FrenchFlair ;
- historique glissant de 30 matchs ;
- pondération exponentielle par ancienneté avec plancher ;
- moyenne et sigma rugby pondérés ;
- récupération rugby multi-saisons ;
- historique football par équipe ;
- probabilité de nul DrawHunter issue des données réelles ;
- Worker API Bridge 3.8.0 ;
- tests V8 dédiés.


## 9.0.2
- Correction complète de la compatibilité frontend/Worker des historiques rugby et football.
- Limitation de concurrence des appels historiques.
- Recherche par identifiant ou nom et décodage HTML.
- Worker 3.9.3 aligné dans le dépôt.

## V11.1.1 — Correctif Explainable AI DrawHunter
- Le bloc d’explication utilise les indicateurs déjà calculés et ne dépend plus uniquement de predictionStatus.
- Aucun appel API supplémentaire.

## V11.2.2 — Team Branding Paris & Journal
- Logos des équipes ajoutés aux paris et aux entrées du Journal.
- Métadonnées de branding persistées dans les nouveaux paris et analyses.

## V11.3.8 — Stabilisation Cloud Sync / quota D1

- cycle de synchronisation automatique porté de 30 s à 5 min ;
- aucun cycle périodique lorsque l'onglet est masqué ;
- suppression de l'appel `/v1/me` à chaque synchronisation ;
- détection des écritures cloud strictement identiques afin d'éviter un INSERT/UPDATE et un change_log inutiles ;
- classification explicite des dépassements quotidiens D1 dans le Worker.

## V11.3.15 — Sports Data Refresh Fix

- Sépare définitivement le cycle de chargement Football/Rugby du cycle de navigation et du bootstrap Cloud.
- Le chargement sportif s'exécute en arrière-plan sans bloquer l'ouverture de SportLab.
- Les payloads DrawHunter/FrenchFlair sont publiés puis la vue active est automatiquement rerendue dès réception.
- Le bouton « Actualiser » force désormais un vrai refresh sportif sans changer de page ni redémarrer le Cloud.
- Pendant un refresh, les matchs déjà chargés restent visibles et l'UI distingue « chargement » d'un vrai résultat à 0 rencontre.
- Conserve intégralement V11.3.12 Tombstone Guard, V11.3.14 Cloud Bootstrap, navigation rapide et anti-zoom iOS.
- Aucun changement des modèles DrawHunter/FrenchFlair, Bet Store, settlement ou fenêtre J+1.
