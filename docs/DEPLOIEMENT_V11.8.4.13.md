# V11.8.4.13 — File bornée et protection API

## Déploiement : deux éléments

1. Dans Cloudflare, ouvrir le Worker API existant `sportlab-api-bridge` et remplacer son code par le contenu de `cloudflare-worker/sportlab-api-bridge-v3.11.1.js`. Déployer dans ce même Worker, en conservant ses secrets, bindings et URL. Ne pas modifier le Worker de synchronisation, sa base ou sa configuration. Ne pas exécuter `npm run deploy` dans le dossier cloudflare-worker : son projet Wrangler concerne la synchronisation, pas ce Bridge autonome.
2. Remplacer le contenu du dépôt SportLab par cette archive complète, y compris `.github/workflows`, puis laisser GitHub Pages déployer. Aucune modification des moteurs de prédiction ni du snapshot serveur existant.

L'archive conserve le Bridge 3.11.0 comme référence. La nouvelle protection côté fournisseur nécessite bien de déployer le fichier 3.11.1 dans Cloudflare ; la mise à jour GitHub seule ne modifie pas le Worker.

## Corrections

Le navigateur ne relance plus automatiquement les demandes refusées en 429. Le Bridge ne relance plus non plus un appel refusé. Après un 429 HTTP ou une erreur métier API-Sports de limitation, le Bridge suspend les appels au même hôte API pendant au moins 60 secondes, ou davantage si Retry-After l'exige. La pause est vérifiée avant chaque appel amont et ne touche pas les routes de sauvegarde.

Le navigateur suspend globalement les nouvelles demandes lorsque le Bridge indique une pause. Un délai fournisseur d'au moins 45 secondes clôt immédiatement la file en attente ; deux 429 en moins de deux minutes déclenchent une protection d'au moins deux minutes. Une réussite isolée ne remet plus cette mémoire à zéro. La pause est conservée localement à travers les réouvertures lorsque le stockage est disponible. Actualiser et Forcer respectent la protection ; les clics ne prolongent pas sa durée.

En dehors de cette protection, chaque demande navigateur attend au plus 45 secondes dans la file. L'expiration retire la demande et ne la relance pas. Ce délai ne couvre pas l'exécution d'une demande déjà démarrée. Le générateur serveur conserve son rythme de 10 départs par minute, ses tentatives explicites et un délai de file distinct de dix minutes.

Si une compétition échoue ou un historique demandé rencontre une erreur, le cycle termine en récupération incomplète. Le runtime conserve le dernier payload disponible et n'écrit pas le résultat partiel comme nouveau snapshot. Les historiques réussis restent en cache pour alléger la prochaine récupération. Ce choix peut retarder la publication de nouvelles rencontres jusqu'à la réussite du prochain cycle ; il protège la cohérence des analyses existantes.

La récupération différée ne constitue pas une promesse de reprise automatique. Après la pause, utiliser Actualiser pour lancer un nouveau cycle ; les politiques de fraîcheur récentes continuent de s'appliquer.

## Diagnostic attendu

Le rapport affiche la version 11.8.4.13 et ajoute :

- `scheduler.queued` : nombre actuel de demandes dans la file ;
- `scheduler.deferred` et `deferredEvents` : demandes retirées ou refusées avant exécution, séparées des échecs réseau ;
- `rateLimitEvents.circuitOpen` : activation de la protection ;
- `bridgeDiagnostics` : version du Bridge, compteurs d'appels amont et observations des quotas minute/jour, avec date et hôte API. Les valeurs non fournies par API-Sports restent nulles.

Les diagnostics du Bridge et sa pause sont limités à une instance du Worker (`scope: worker-instance`). Ils ne constituent pas un compteur global du compte API-Sports ni un verrou distribué entre toutes les instances, appareils et processus. Le quota de 240 appels/minute déjà présent dans le Bridge est conservé ; les nouvelles observations permettront de déterminer si un ajustement par sport est nécessaire. Aucun secret API n'est inclus dans le rapport.

Une réponse 503 `API_SPORTS_COOLDOWN` indique une demande évitée par le Bridge ; elle ne doit pas être comptée comme un nouveau 429 d'API-Sports. Une limitation réelle reste possible : cette version évite les reprises en rafale et l'accumulation, sans garantir la disparition des refus du fournisseur.

## Validation

Vérifications de syntaxe et 272 tests réussis. Tests avec réseau et horloge simulés : pas de reprise 429 implicite, pause conservée après une réussite isolée, clôture de file, délai d'attente, réouverture pendant une pause, reprise après expiration, conservation des snapshots, erreurs métier HTTP 200, HTTP 429 malformé, Retry-After au format date et remontée des quotas. Les tests ne contactent pas le Worker déployé ni API-Sports.
