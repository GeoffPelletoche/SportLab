# Sprint 7.1.2A — Sync Engine V2

## Architecture

`modules -> DiffEngine -> Queue V2 -> SyncEngine -> Cloud API -> Worker -> D1`

## Déclencheurs automatiques

- démarrage de l'application ;
- événements métier DrawHunter, French Flair et paris ;
- changement local détecté ;
- retour du réseau ;
- retour de l'onglet au premier plan ;
- cycle périodique de 30 secondes.

## Offline Queue V2

Chaque élément conserve : identité, date de mise en file, nombre de tentatives, prochaine tentative et dernière erreur. Un nouvel état de la même clé remplace l'ancien sans dupliquer la file.

## Résilience

- verrou d'exécution ;
- demande de second passage si une modification arrive pendant la synchronisation ;
- backoff exponentiel de 2 secondes jusqu'à 5 minutes ;
- aucune suppression globale de la file après un push partiel ;
- lots plafonnés à 250 changements.

## Conflits

La stratégie V2 est Last-Write-Wins à partir de `clientUpdatedAt`. Une version serveur gagnante est appliquée localement. Une version cliente gagnante est remise en file avec la dernière `baseVersion` serveur.

## Événements

- `sync:start`
- `sync:push`
- `sync:pull`
- `sync:conflict`
- `sync:queue`
- `sync:complete`
- `sync:error`
- `cloud:status`
