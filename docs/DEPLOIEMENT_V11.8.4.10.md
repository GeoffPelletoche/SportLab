# V11.8.4.10 — Corrective Refresh / Cycle Guard

## Défauts constatés dans le code V11.8.4.9

- `runSportLabCloudSync()` rappelait `init()` après la synchronisation. L'enregistrement du capital rappelait aussi `init()`. Chaque appel relançait les trois sports lorsque les promesses du premier chargement étaient terminées.
- Les verrous existants ne protégeaient que les requêtes simultanées, pas une réinitialisation après leur fin.
- Chaque refresh passait systématiquement le module à `ready = false`, même avec un snapshot complet affiché.
- Le bouton de diagnostic de règlement rechargeait les données sportives en dehors des verrous du runtime.
- Les phases et `completeMs` mélangeaient les publications de payload et les fins réelles de cycle.

Ces chemins peuvent expliquer le second cycle du rapport fourni. Ce rapport ne contient pas son déclencheur : il ne permet pas de prouver quel chemin a été emprunté pendant cette session. Un snapshot de 64 minutes dépasse la fenêtre de fraîcheur automatique de 60 minutes ; le premier refresh réseau était donc attendu selon la politique V11.8.4.9. Les erreurs de fixtures et leurs délais ne sont pas résolus par ce correctif.

## Correctif

- Un cycle `startup` par session ; un cycle `manual` par rafraîchissement explicite.
- Réservation synchrone de chaque module avant toute publication ; un module ne peut pas rouvrir le même cycle après une modification de snapshot.
- Initialisation et clics Actualiser simultanés mutualisés.
- Cloud et capital ne republient que les données locales, sans relance sportive. Le diagnostic de règlement réutilise les payloads déjà chargés.
- Un snapshot complet reste prêt pendant les requêtes réseau ; les données progressives restent en staging, avec les protections de saisie existantes.
- Les retries de démarrage restent disponibles sans snapshot exploitable. Avec un snapshot exploitable, une panne n'entraîne pas une nouvelle série complète de requêtes : le payload précédent est conservé.
- Diagnostic : `loadCycleId`, `module`, `trigger`, `snapshotVersion`, `parentCycleId`, `reason`, cycles et erreurs de fixtures disponibles dans les phases. `readyAtMs` mesure la disponibilité des analyses ; `completeMs` mesure la fin du refresh. Une seule fin de cycle est enregistrée.

## Déploiement

Remplacer les fichiers du dépôt par le contenu de l'archive, en incluant `.github/workflows`, puis lancer le déploiement GitHub Pages habituel. Aucun déploiement Cloudflare requis.

Les moteurs d'analyse, règles de pari, Worker Cloudflare, snapshot existant et paramètres du scheduler/API sont inchangés. Le nom de version dans les workflows et le générateur de snapshot est aligné sur 11.8.4.10.

## Validation

**Résultat : 257 tests réussis, 0 échec ; vérifications de syntaxe réussies.**

`npm run validate` exécute les vérifications de syntaxe et toute la suite de tests. Les nouveaux tests exécutent le runtime réel dans un environnement DOM/services simulé : snapshot 8/12/1, refresh suspendu, appels concurrents, actions cloud/capital, panne réseau avec conservation des données et nouveau refresh manuel après la fin du précédent. Ils n'appellent pas les API externes.

Après déploiement, ouvrir Diagnostics et copier les mesures : un seul cycle `startup` par module est attendu tant que le bouton Actualiser n'est pas utilisé. Un clic ultérieur doit montrer un nouveau cycle `manual`. Vérifier le fonctionnement réel sur Safari et PC, y compris la synchronisation cloud et la saisie pendant les requêtes.
