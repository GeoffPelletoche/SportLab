# SportLab Design Language — SDL 1.0

## Statut

Référentiel officiel de l’interface SportLab à partir de la V6.3.7.

Le SDL définit les règles visuelles et ergonomiques. Il ne contient pas de logique métier et ne remplace pas les moteurs DrawHunter, FrenchFlair, le settlement engine, les stores ou les services.

---

## 1. Principes fondateurs

### 1.1 Orientation données
L’interface doit faire ressortir rapidement :
- le nombre de matchs à analyser ;
- les opportunités VALUE ;
- les paris placés ;
- les résultats, le ROI et les alertes ;
- l’état de synchronisation.

### 1.2 Sobriété Premium
Le style SportLab repose sur :
- un fond sombre profond ;
- des surfaces bleutées ;
- des accents lumineux mesurés ;
- des ombres douces ;
- peu de décorations gratuites ;
- une hiérarchie visuelle forte.

### 1.3 Cohérence intermodules
DrawHunter et FrenchFlair utilisent :
- les mêmes structures ;
- les mêmes composants ;
- les mêmes espacements ;
- les mêmes états ;
- seulement une couleur d’accent spécifique au module.

### 1.4 Mobile-first
Toute vue doit rester exploitable sur iPhone avant d’être enrichie pour tablette et desktop.

---

## 2. Architecture visuelle officielle

Ordre recommandé d’une page SportLab :

1. Navigation
2. Gap de séparation
3. Hero ou en-tête de page
4. KPI
5. Contenu principal
6. Alertes ou informations secondaires
7. Synchronisation ou diagnostics

Rythme vertical officiel :

- Navigation → contenu : 12 px
- Grande section → grande section : 24 px
- Sous-section → sous-section : 16 px
- Élément compact → élément compact : 8 à 12 px

---

## 3. Échelle d’espacement

Valeurs autorisées :

| Token | Valeur | Usage |
|---|---:|---|
| `--sl-space-1` | 4 px | micro-écart |
| `--sl-space-2` | 8 px | badges, icônes |
| `--sl-space-3` | 12 px | navigation, champs |
| `--sl-space-4` | 16 px | contenu standard |
| `--sl-space-5` | 24 px | sections |
| `--sl-space-6` | 32 px | grands blocs |
| `--sl-space-7` | 48 px | respiration forte |
| `--sl-space-8` | 64 px | grands écrans |

Aucune nouvelle valeur arbitraire ne doit être introduite sans justification.

---

## 4. Grille et largeur

- Largeur maximale : 1240 px
- Gouttière tablette/desktop : 14 px
- Gouttière mobile : 10 px
- Grilles principales : 1, 2, 3 ou 4 colonnes
- Tout composant doit tolérer `min-width: 0`

Breakpoints officiels :

| Nom | Largeur |
|---|---:|
| Mobile | ≤ 640 px |
| Tablette | 641–900 px |
| Desktop | 901–1439 px |
| Large | ≥ 1440 px |

---

## 5. Typographie

Police système :
`Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`

| Rôle | Taille | Graisse | Interligne |
|---|---:|---:|---:|
| Display | 32 px | 800 | 1.15 |
| H1 | 28 px | 800 | 1.2 |
| H2 | 22 px | 800 | 1.25 |
| H3 | 18 px | 750 | 1.3 |
| Title | 16 px | 700 | 1.35 |
| Body | 15 px | 400 | 1.55 |
| Small | 13 px | 500 | 1.45 |
| Caption | 12 px | 600 | 1.4 |
| Label | 12 px | 800 | 1.2 |

Les labels peuvent être en capitales avec un espacement de lettres léger.

---

## 6. Couleurs sémantiques

### Fond et surfaces
- Background : `#08101d`
- Surface 1 : `#111c2d`
- Surface 2 : `#162235`
- Surface élevée : `#1b2a40`

### Texte
- Texte principal : `#f8fafc`
- Texte secondaire : `#cbd5e1`
- Texte atténué : `#94a3b8`

### États
- Primary : `#38bdf8`
- Secondary : `#8b5cf6`
- Success : `#22c55e`
- Warning : `#f59e0b`
- Danger : `#ef4444`
- Info : `#3b82f6`

### Accents modules
- DrawHunter : `#38bdf8`
- FrenchFlair : `#a855f7`

Les couleurs d’état ne doivent pas être utilisées uniquement comme décoration.

---

## 7. Rayons

| Token | Valeur | Usage |
|---|---:|---|
| `--sl-radius-xs` | 8 px | petits éléments |
| `--sl-radius-sm` | 12 px | boutons, champs |
| `--sl-radius-md` | 18 px | cartes |
| `--sl-radius-lg` | 24 px | héros, panneaux majeurs |
| `--sl-radius-pill` | 999 px | badges |

---

## 8. Ombres

- XS : séparation légère
- SM : contrôle interactif
- MD : carte standard
- LG : panneau élevé
- Focus : halo d’accessibilité

Les ombres ne remplacent pas les bordures.

---

## 9. États interactifs

Tout élément interactif doit définir :
- `hover`
- `focus-visible`
- `active`
- `disabled`

Règles :
- translation maximale : 2 px ;
- durée standard : 180 à 220 ms ;
- focus visible obligatoire ;
- pas d’animation critique pour comprendre une action.

---

## 10. Composants officiels

Le Design System doit fournir au minimum :
- boutons ;
- cartes ;
- panneaux ;
- KPI ;
- badges ;
- alertes ;
- formulaires ;
- tableaux ;
- états vides ;
- skeletons ;
- navigation ;
- héros de page.

Chaque composant possède une classe racine `sl-*`.

---

## 11. Densité

SportLab privilégie une densité moyenne :
- assez compacte pour consulter plusieurs matchs ;
- assez aérée pour éviter l’effet tableau technique brut.

Variantes :
- standard ;
- compact ;
- confortable.

---

## 12. Responsive

### Mobile
- une colonne ;
- actions principales pleine largeur ;
- tableaux scrollables ;
- textes secondaires réduits ;
- aucune interaction dépendante du survol.

### Tablette
- deux colonnes lorsque pertinent ;
- cartes équilibrées ;
- navigation adaptée.

### Desktop
- jusqu’à quatre KPI ;
- panneaux côte à côte ;
- largeur maximale contrôlée.

---

## 13. Accessibilité

- contraste suffisant ;
- focus visible ;
- labels explicites ;
- cible tactile minimale de 44 px ;
- informations non transmises uniquement par la couleur ;
- support de `prefers-reduced-motion`.

---

## 14. Règles de gouvernance

1. Aucun style inline pour la structure visuelle.
2. Aucun nouveau composant sans classe `sl-*`.
3. Aucun nouveau token sans ajout au présent référentiel.
4. Les classes historiques sont tolérées uniquement pendant la migration.
5. Les nouvelles vues utilisent exclusivement le Design System.
6. Les moteurs métier restent indépendants du CSS.
