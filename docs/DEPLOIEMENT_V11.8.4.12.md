# V11.8.4.12 — Actualiser avec fraîcheur persistante

## Problème corrigé

En V11.8.4.11, une réouverture récente pouvait charger uniquement les snapshots. Le cache réseau de l'onglet restait vide ; le premier Actualiser lançait alors les 18 demandes de fixtures malgré des données vérifiées quelques minutes plus tôt. Dans le rapport fourni, deux réponses 429 ont ajouté deux pauses de 15 secondes et DrawHunter a terminé son refresh manuel en 56,47 secondes.

## Comportement

Actualiser vérifie chaque sport indépendamment. Un snapshot complet sans erreur, vérifié il y a moins de cinq minutes, est réutilisé. À moins de quinze minutes d'un coup d'envoi connu, le délai maximal de réutilisation est d'une minute. Au-delà du délai applicable, la récupération réseau est exécutée normalement. Les snapshots vides issus d'une vérification réussie peuvent également être réutilisés.

Une vérification réseau est requise lorsque les données indiquent une erreur, que les historiques nécessaires sont incomplets, que la fenêtre de dates a changé ou qu'un coup d'envoi est passé depuis la dernière vérification. Les nouvelles rencontres inconnues peuvent attendre jusqu'à cinq minutes avant le prochain rafraîchissement normal ; Forcer permet une vérification immédiate si nécessaire.

Le bouton Forcer est disponible à côté d'Actualiser sur le dashboard. Il contourne les deux réutilisations (snapshot et réponses récentes d'une minute). Il ne contourne pas les quotas, la file séquentielle, les priorités, les caches du Worker ni les pauses demandées par l'API. Les actions concurrentes restent mutualisées par le runtime.

## Dates conservées

La politique utilise `fixturesVerifiedAt`, puis `syncedAt`, puis `snapshotSavedAt` uniquement comme repli historique. La date de sauvegarde locale ne rend pas à nouveau fraîches des données anciennes. Les payloads `fixtureRefreshSkipped` ne sont plus réécrits en IndexedDB : leur temps de vérification et leur expiration sont conservés lors des réouvertures et des clics répétés.

La politique automatique au démarrage conserve ses fenêtres existantes de 30 à 60 minutes, avec vérification supplémentaire des erreurs et de la période. Le générateur de snapshot serveur est inchangé dans son fonctionnement.

## Diagnostic attendu

Après une réouverture, cliquer sur Actualiser pendant la fenêtre de fraîcheur : un cycle manual apparaît ; les modules réutilisés présentent une entrée `refreshDecisions` avec `action: skip`, `reason: recently-verified-snapshot`, `ageMs` et `windowMs`. Si les trois sports sont éligibles, le scheduler n'enregistre aucune nouvelle requête sportive. Les compteurs `requestReuse.recent/inFlight` concernent toujours exclusivement le cache réseau, pas cette réutilisation de snapshots.

Avec Forcer, le cycle reste manual et les décisions portent `action: refresh`, `reason: forced`. Les réponses 429 restent possibles lors d'une récupération réseau ; cette version évite les demandes inutiles mais ne promet pas l'absence de limitations du fournisseur.

## Déploiement et validation

Remplacer le contenu du dépôt par l'archive complète, y compris `.github/workflows`, puis déployer via GitHub Pages. Aucun changement de Worker Cloudflare à déployer.

Les tests vérifient la première actualisation après réouverture, les limites des cinq minutes/une minute, les erreurs, les historiques incomplets, la période de dates et les coups d'envoi. Ils exécutent les services et le client/scheduler réels avec réseau et horloge simulés ; les tests de Forcer vérifient que deux clics successifs redemandent leurs fixtures même pendant le cache réseau d'une minute. La sauvegarde d'un snapshot réutilisé est testée sans accès à IndexedDB. Le routage des boutons et leur déverrouillage sont également testés.

Les cartes DrawHunter déjà terminées restent filtrées. Les enregistrements, moteurs d'analyse, Workers et snapshot existant sont conservés.

Validation finale : vérifications de syntaxe réussies ; 269 tests réussis, aucun échec.
