# Guide d’intégration — Pack 3

## 1. Copier les fichiers

```text
assets/sportlab-components.css
ui/components/sportlabComponents.js
ui/interactions/sportlabUi.js
```

## 2. Charger le CSS

Dans `index.html`, après le Pack 2 :

```html
<link rel="stylesheet" href="./assets/style.css">
<link rel="stylesheet" href="./assets/sportlab.css">
<link rel="stylesheet" href="./assets/sportlab-components.css">
```

## 3. Initialiser les interactions

Dans le point d’entrée JavaScript :

```js
import { initSportLabUi } from "./ui/interactions/sportlabUi.js";

initSportLabUi();
```

## 4. Utiliser les fonctions de rendu

Exemple :

```js
import {
  renderAlert,
  renderButton,
  renderKpi
} from "./ui/components/sportlabComponents.js";

const alertHtml = renderAlert({
  title: "Synchronisation réussie",
  description: "Les données sont à jour.",
  tone: "success",
  icon: "✅"
});
```

## 5. Migration recommandée

Ordre :
1. Dashboard ;
2. DrawHunter ;
3. FrenchFlair ;
4. Journal ;
5. Portfolio ;
6. Diagnostics.

Remplacer d’abord les petits composants isolés :
- badges ;
- boutons ;
- alertes ;
- KPI ;
- empty states.

Migrer ensuite les cartes complexes.
