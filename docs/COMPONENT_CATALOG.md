# Catalogue des composants — Pack 3

| Composant | CSS | Helper JS | Interaction |
|---|---|---|---|
| Card | Oui | `renderCard` | Non |
| Button | Oui | `renderButton` | Non |
| Badge | Pack 2 + Pack 3 | `renderBadge` | Non |
| KPI | Oui | `renderKpi` | Non |
| Alert | Oui | `renderAlert` | Non |
| Empty State | Oui | `renderEmptyState` | Non |
| Progress | Oui | `renderProgress` | Non |
| Field | Oui | `renderField` | Non |
| Skeleton | Pack 2 + Pack 3 | `renderSkeleton` | Non |
| Data List | Oui | `renderDataList` | Non |
| Tabs | Oui | HTML | Oui |
| Modal | Oui | HTML | Oui |
| Toast | Oui | `showToast` | Oui |

## Convention

- Racine : `.sl-*`
- État : `.is-*`
- Déclencheur comportemental : `[data-sl-*]`
- Les fonctions de rendu échappent les valeurs textuelles.
- Les fragments HTML explicitement passés comme `body`, `footer`, `actions` restent sous la responsabilité de la vue appelante.
