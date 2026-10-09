# V11.8.4.14 — Pauses indépendantes et arrêt des historiques

## Déploiement

1. Dans Cloudflare, ouvrir le Worker API existant `sportlab-api-bridge`, remplacer son code par `cloudflare-worker/sportlab-api-bridge-v3.11.2.js` et déployer. Conserver son URL, ses secrets et ses bindings. Ne pas modifier le Worker de synchronisation ni exécuter le déploiement Wrangler du dossier cloudflare-worker, qui concerne la synchronisation.
2. Remplacer le contenu du dépôt SportLab par cette archive complète, y compris `.github/workflows`, puis laisser GitHub Pages déployer.

Cette livraison conserve les Bridges précédents pour référence. La mise à jour GitHub ne déploie pas le Bridge Cloudflare.

## Problème observé

En 11.8.4.13, le rapport réel indiquait deux refus sur les historiques rugby et 164 demandes différées localement. La file était vide et les cycles terminés, mais la protection rugby bloquait également les historiques football. Le quota observé avant le refus était encore de 296/300 pour la minute et 7470/7500 pour la journée ; la réponse refusée était HTTP 200 avec une erreur métier et sans en-têtes de quota. Le message fournisseur exact manquait au diagnostic.

## Corrections

Les pauses et la mémoire des refus sont indépendantes pour rugby, football et NFL. Un refus sur `/rugby/team-games` retire les demandes rugby en attente et suspend les nouvelles demandes rugby. Les demandes football et NFL continuent dans la file séquentielle commune, avec leurs priorités et le délai minimal de 900 ms. Une nouvelle demande éligible réveille la file, même lorsque celle-ci attendait une API suspendue.

Les services consultent la pause avant de soumettre chaque historique manquant. Après un refus ou une récupération différée, le cycle ne soumet plus les historiques suivants de ce sport. Les historiques déjà disponibles restent utilisables. Une seule équipe de chargement s'applique désormais à toutes les compétitions d'un sport : trois enrichissements rugby et deux football, au lieu de multiplier ces limites par le nombre de compétitions. Les quelques demandes déjà soumises peuvent être retirées par le scheduler.

Les historiques sautés ne sont pas comptés comme des appels API. Les diagnostics de module ajoutent `historySkipped` et `historyStopped`; le détail conservé dans `historyDiagnostics` inclut `skipped` et `stopped`. Les cycles incomplets gardent les derniers snapshots et ne sauvegardent pas le résultat partiel comme nouvelles données vérifiées.

Chaque pause est conservée localement par sport à travers une réouverture. Une éventuelle pause globale encore active de la version précédente est respectée jusqu'à son expiration ; aucune nouvelle pause rugby n'est enregistrée comme pause globale. Actualiser et Forcer respectent les pauses. Après expiration, Actualiser peut lancer un nouveau cycle ; les clics ne prolongent pas la pause.

## Diagnostic fournisseur

Le Bridge 3.11.2 ajoute `providerErrors` dans `bridgeDiagnostics` : hôte, date, statut HTTP amont, classification du Bridge, contenu de `errors` fourni par API-Sports et éventuel Retry-After. Les messages sont limités à 4000 caractères et la clé API est masquée. Les vingt erreurs les plus récentes sont conservées par instance du Worker.

Si une réponse omet les en-têtes de quota, les champs courants restent nulls. `lastKnownQuota` conserve la dernière observation disponible avec sa date, sans présenter ces anciens chiffres comme un quota actuel. Les limites et pauses du Bridge restent propres à une instance du Worker, pas à l'ensemble du compte API-Sports.

Le classement des erreurs fournisseur reste conservateur. Cette version permet de connaître le message réel qui provoque le refus ; elle ne prétend pas résoudre une restriction fournisseur encore inconnue. Elle ne garantit pas la disparition des 429.

## Validation

Syntaxe validée et 277 tests réussis. Les tests exécutent les services et la file réels avec réseau et horloge simulés : refus rugby pendant un chargement combiné, arrêt des demandes suivantes, réussite des historiques football, maintien des appels NFL, réouverture et expiration d'une pause par sport, réveil de la file, erreurs métier HTTP 200, distinction des erreurs d'abonnement, conservation du dernier quota connu et masquage de la clé. Les moteurs de prédiction, le Worker de synchronisation et le snapshot serveur livré restent inchangés.
