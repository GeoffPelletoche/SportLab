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
