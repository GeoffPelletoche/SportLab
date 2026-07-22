# Installation — SportLab V6.3.7 Pack 2

## Option recommandée

Remplacer :

`assets/sportlab.css`

par le fichier :

`pack-2-design-system/assets/sportlab.css`

Conserver temporairement le fichier historique `assets/style.css`.

Ordre conseillé dans `index.html` :

```html
<link rel="stylesheet" href="./assets/style.css">
<link rel="stylesheet" href="./assets/sportlab.css">
```

Le Design System est chargé après le CSS historique afin de prendre la priorité sur les règles migrées.

## Architecture fournie

- `assets/sportlab.css` : build complet prêt à intégrer ;
- `assets/css/sportlab-modular.css` : manifeste avec imports ;
- `assets/css/modules/` : sources modulaires.

## Important

Le pack n’altère pas :
- les moteurs DrawHunter ou FrenchFlair ;
- le settlement engine ;
- les services ;
- les stores ;
- les données utilisateur ;
- la navigation JavaScript.

## Validation recommandée

Tester au minimum :
1. Dashboard
2. Menu hamburger
3. DrawHunter
4. FrenchFlair
5. Journal
6. Portfolio
7. Diagnostics
8. iPhone ≤ 640 px
9. Tablette 641–900 px
10. Desktop > 900 px
