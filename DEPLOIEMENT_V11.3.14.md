# SportLab V11.3.14 — Sync Tombstone Guard

## Objectif
Empêcher un navigateur/PWA ancien (notamment iPhone) de recréer des suppressions Cloud à partir de clés localStorage absentes ou de tombstones restés dans une ancienne file Sync V2.

## Protections ajoutées
- Le scanner automatique local ne produit plus jamais `deleted=true`.
- Les entrées `deleted=true` héritées d’anciennes files Sync V2 sont purgées avant tout push.
- `queueManager.enqueue()` refuse tout tombstone implicite.
- Une voie future de suppression explicite reste possible uniquement avec `deleteIntent=explicit-user-delete`.
- Lors d’un conflit, un tombstone déjà présent côté Cloud est toujours autoritaire.

## Déploiement
Déployer l’intégralité du projet V11.3.14 sur GitHub Pages. Aucun changement du Worker Cloud Sync ni de l’API Bridge 3.10.1 n’est requis pour cette version.

## Validation Clean Start
Après déploiement, garder SportLab fermé sur les autres appareils et reprendre le protocole contrôlé PC → D1 → iPhone → D1 avant toute nouvelle analyse ou pari.
