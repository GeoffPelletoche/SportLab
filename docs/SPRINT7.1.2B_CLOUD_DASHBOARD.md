# Sprint 7.1.2B — Cloud Dashboard

## Statut
Implémenté et validé sur la base V7.1.2A Sync Engine V2.

## Objectif
Fournir une vue utilisateur dédiée au cloud, sans déplacer la logique du Sync Engine V2 et sans modifier les moteurs métier.

## Fonctions livrées
- page `Cloud` dans la navigation principale ;
- état connecté, déconnecté, hors ligne, erreur ou synchronisation en cours ;
- dernière synchronisation, dernier push, dernier pull et dernière tentative ;
- informations de file V2 : prêts, différés, tentatives et attente totale ;
- compteurs cumulés de push, pull et conflits ;
- appareil enregistré et motif de la dernière synchronisation ;
- résumé local des données synchronisables ;
- commande `Synchroniser maintenant` ;
- accès aux paramètres cloud existants ;
- accès direct aux diagnostics en cas d'erreur.

## Architecture
- `ui/views/cloudDashboardView.js` : rendu pur de la page ;
- `services/renderService.js` : préparation du statut cloud et du résumé local ;
- `legacyApp.js` : commandes d'interface uniquement ;
- `core/sync/*` : inchangé ;
- moteurs métier et settlement engine : inchangés.

## Validation
- `npm run check` : réussi ;
- `npm test` : 3/3 tests Sync Engine V2 réussis.
