# SportLab V6.3.7 — Pack 3 UI Components Premium

Ce pack construit la bibliothèque UI officielle au-dessus du Pack 2 Design System Premium.

## Contenu

### CSS
- cartes ;
- boutons avancés ;
- KPI ;
- alertes ;
- états vides ;
- progression ;
- tabs et segmented controls ;
- modal ;
- toast ;
- formulaires enrichis ;
- listes de données ;
- responsive des composants.

### JavaScript
- fonctions de rendu HTML sans logique métier ;
- initialisation des tabs ;
- ouverture et fermeture des modals ;
- gestion du focus dans les modals ;
- notifications Toast.

### Démonstration
- galerie HTML de validation visuelle.

## Dépendance

Le Pack 3 nécessite le Pack 2 :

```html
<link rel="stylesheet" href="./assets/style.css">
<link rel="stylesheet" href="./assets/sportlab.css">
<link rel="stylesheet" href="./assets/sportlab-components.css">
```

## Installation

Copier :

```text
assets/sportlab-components.css
ui/components/sportlabComponents.js
ui/interactions/sportlabUi.js
```

dans les dossiers correspondants du dépôt.

Ajouter le CSS après `sportlab.css`.

Initialiser les interactions une seule fois dans le point d’entrée de l’application :

```js
import { initSportLabUi } from "./ui/interactions/sportlabUi.js";

initSportLabUi();
```

## Sécurité de migration

Le pack :
- ne modifie aucun moteur métier ;
- ne modifie aucun store ;
- ne modifie pas le settlement engine ;
- n’impose aucune réécriture immédiate des vues existantes ;
- peut être intégré progressivement.


## V6.3.7 — Pack 4

Dashboard Premium V2 intégré. Voir `docs/PACK4_DASHBOARD_PREMIUM_V2.md`.


## V6.3.8 — Pack 4.1

Finition Desktop Cockpit ajoutée. Voir `docs/PACK4.1_DESKTOP_COCKPIT.md`.
