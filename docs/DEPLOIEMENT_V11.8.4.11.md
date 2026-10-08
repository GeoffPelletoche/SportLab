# V11.8.4.11 — DrawHunter terminé / Actualiser maîtrisé

## Cartes DrawHunter

Une analyse en cours reste visible, même lorsque la cote saisie produit NO BET ou une value proche de zéro. La validation explicite via Terminer ou l'enregistrement de l'analyse/du pari clôt le travail : la carte disparaît de l'atelier. Les anciens statuts analyzed/decided/value/tracked sont également reconnus comme terminés. Les paris déjà enregistrés sont reconnus même si leur workflow local manque.

Le filtrage ne supprime aucun enregistrement : les paris, workflows, historiques et données pour l'évaluation restent conservés. Après validation, la vue est reconstruite à partir des stores locaux et la navigation existante vers la prochaine analyse est conservée. Une saisie sur la carte validée est quittée explicitement afin que Safari ne bloque pas le rendu.

## Actualiser et file d'attente

- Une réponse de fixtures réussie peut être réutilisée pendant 60 secondes en mémoire dans le même onglet. Sa date d'expiration n'est pas repoussée par les lectures. Après expiration, une nouvelle demande est faite. Un nouvel onglet/rechargement repart sans ce cache.
- Les listes vides réussies sont également réutilisables. Aucun échec HTTP n'est mis en cache.
- Deux requêtes identiques simultanées et avec les mêmes paramètres de retry/timeout partagent une seule exécution. Les paramètres URL sont ordonnés pour reconnaître les doublons.
- La réutilisation des fixtures est désactivée pour les builds de snapshots serveur. Un appel interne peut utiliser forceFresh pour contourner le cache récent.
- Le débit minimal de 900 ms entre requêtes dans le navigateur reste en place ; la file reste séquentielle et les priorités NFL/fixtures/historiques sont conservées.
- Tout HTTP 429 impose la pause globale avant que le scheduler ne puisse avancer, même lorsque son appelant n'a plus de retry. La pause est au moins 15 secondes et progresse jusqu'à 60 secondes en cas de 429 successifs ; un succès réinitialise cette progression. Les délais plus longs indiqués par le serveur sont respectés. Les builds serveur conservent leur temporisation initiale de 90 secondes et leur plafond de progression de 180 secondes.
- Retry-After numérique, date HTTP et retryAfterMs sont pris en compte ; le plus long délai annoncé est retenu. La file revérifie la deadline après chaque attente.

Cette version réduit les requêtes redondantes pendant un Actualiser proche d'un chargement précédent. Elle ne garantit pas l'absence de 429 : les quotas et les autres appareils/processus peuvent encore provoquer une limitation. Elle ne réduit pas une pause explicitement demandée par le fournisseur.

## Diagnostic

`requestReuse.recent` compte les réponses récentes réutilisées ; `requestReuse.inFlight` compte les doublons simultanés regroupés. Les événements indiquent la route et l'instant dans la session. `scheduler.rateLimitEvents` expose route, pauseMs, retryAfterMs et blockedUntil. Les cycles startup/manual et readyAtMs restent disponibles.

## Déploiement et vérification réelle

Remplacer les fichiers du dépôt par le contenu complet de l'archive, en incluant `.github/workflows`, puis déployer sur GitHub Pages. Aucun changement/déploiement de Worker Cloudflare requis. Le snapshot préexistant est conservé tel quel.

Vérifier sur Safari et PC :

1. Une ancienne analyse terminée ou un pari déjà enregistré ne doit plus apparaître dans DrawHunter.
2. Une nouvelle cote donnant une value faible doit laisser la carte visible tant que Terminer n'est pas validé. Après validation, elle doit disparaître et l'analyse suivante devenir la cible de navigation.
3. Un pari enregistré doit disparaître de l'atelier et rester disponible dans les stores/journal.
4. Actualiser peu après le premier refresh doit montrer des réutilisations dans le diagnostic. Les réponses échouées doivent pouvoir être redemandées. Comparer les compteurs et durées sur des sessions similaires.

Les tests automatisés utilisent le code réel du renderer, des interactions, du client API et du scheduler avec DOM/services/horloge simulés. Aucun appel aux API externes n'est effectué par les nouveaux tests.

Validation : vérifications de syntaxe réussies ; 262 tests réussis, 0 échec.
