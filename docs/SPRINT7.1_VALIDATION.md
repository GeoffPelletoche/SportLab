# Validation — Sprint 7.1 Core Foundation

## Contrôles obligatoires

- Syntaxe de tous les fichiers JavaScript avec `node --check`.
- Validité de tous les fichiers JSON.
- Résolution de chaque import JavaScript relatif.
- Présence unique du point d'entrée `app.js` dans `index.html`.
- Présence de la feuille `sportlab-v7-core.css`.
- Absence de modification dans `core/engines` par rapport à la base V6.5.3.
- Conservation des clés et stores historiques.
- Intégrité ZIP avant livraison.

## Résultat attendu

Le Core doit démarrer avant le runtime compatible V6.5.3. DrawHunter et FrenchFlair doivent conserver leur comportement métier existant. Les migrations de stockage doivent être idempotentes et non destructives.
