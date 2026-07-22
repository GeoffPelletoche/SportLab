# Pack 4.1 — Desktop Cockpit

## Objectif

Améliorer l’occupation de l’espace sur ordinateur sans dégrader le rendu iPhone déjà validé.

## Ajustements

- largeur maximale portée à 1440 px sur desktop et 1540 px sur très grand écran ;
- Hero plus équilibré entre texte et indicateurs ;
- scoreboard plus large ;
- priorité unique étendue à toute la ligne ;
- grille des priorités adaptative selon leur nombre ;
- meilleure proportion entre les modules et la colonne latérale ;
- cartes DrawHunter et FrenchFlair plus confortables ;
- actions rapides et synchronisation mieux dimensionnées ;
- palier spécifique pour les écrans intermédiaires de 901 à 1199 px.

## Périmètre

Le pack ajoute uniquement :

```text
assets/dashboard-desktop-cockpit.css
```

et sa déclaration dans `index.html`.

Aucun fichier JavaScript, moteur, store, service ou format de données n’est modifié.

## Ordre CSS

```html
<link rel="stylesheet" href="./assets/style.css">
<link rel="stylesheet" href="./assets/sportlab.css">
<link rel="stylesheet" href="./assets/sportlab-components.css">
<link rel="stylesheet" href="./assets/dashboard-premium-v2.css">
<link rel="stylesheet" href="./assets/dashboard-desktop-cockpit.css">
```


## Révision fonctionnelle avant lancement

Deux ajustements de fidélité produit ont été intégrés :

### Positionnement DrawHunter
DrawHunter est désormais présenté comme :

> Analyse du match nul · Double chance si pertinente

Le match nul reste le cœur du moteur. La Double Chance est explicitement présentée comme un marché dérivé éventuel.

### Orientation intelligente du bouton principal
Le bouton du Hero ne privilégie plus systématiquement DrawHunter.

Ordre de décision :
1. module ayant le plus d’opportunités VALUE ;
2. sinon module ayant le plus de matchs à analyser ;
3. sinon aucune redirection lorsqu’aucune analyse n’est disponible.
