# SportLab V7.0.0 — Sprint 7.1 Core Foundation

## Objectif

Introduire le noyau V7 au-dessus de la V6.5.3 sans modifier les moteurs métier, les règles VALUE, les projections rugby, le settlement ni les clés de données historiques.

## Architecture livrée

- `core/app/bootstrap.js` : composition et démarrage du noyau.
- `core/app/moduleRegistry.js` : enregistrement, montage et démontage de modules.
- `core/app/lifecycle.js` : cycle de vie et tâches de nettoyage.
- `core/app/router.js` : fondation de routage compatible avec les pages existantes.
- `core/events/eventBus.js` : événements découplés.
- `core/storage/*` : adaptateur local/session, schéma et migrations non destructives.
- `core/settings/settingsStore.js` : préférences unifiées.
- `core/ui/*` : thème, notifications et dialogues communs.
- `core/diagnostics/logger.js` : journalisation structurée et tampon diagnostic.
- `modules/drawhunter` et `modules/frenchflair` : premières définitions modulaires.

## Compatibilité progressive

L'ancien point d'entrée a été encapsulé dans `legacyApp.js`. Le nouveau `app.js` démarre d'abord le Core V7, puis lance l'application V6.5.3 au travers d'une fonction explicite. Cette couche de compatibilité évite une réécriture brutale et protège les données existantes.

## API de diagnostic locale

`window.SportLabCore` expose uniquement une façade en lecture/commande limitée : version, modules déclarés, réglages, thème, densité et diagnostics. Aucun moteur métier n'est exposé ou modifié.

## Hors périmètre

Le Sprint 7.1 ne remplace pas encore toutes les fonctions globales historiques, les `alert()` ou la navigation inline. Ces migrations appartiennent aux sprints V7 suivants et seront réalisées progressivement grâce aux fondations présentes.
