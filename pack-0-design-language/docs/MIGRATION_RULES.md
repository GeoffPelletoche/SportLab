# Règles de migration vers le Design System

## Principe

La migration reste incrémentale et sans modification des moteurs métier.

## Correspondances principales

| Historique | Cible |
|---|---|
| `.card` | `.sl-card` |
| `.dashboard-card` | `.sl-card` |
| `.prediction-card` | `.sl-card` |
| `.sportlab-app-header` | `.sportlab-app-header.sl-topbar` |
| classes de statut historiques | variantes `.sl-badge-*` |

## Ordre recommandé

1. Charger les tokens et fondations.
2. Charger le layout.
3. Charger les composants.
4. Charger les vues.
5. Conserver `style.css` temporairement.
6. Supprimer progressivement les règles devenues inutiles.

## Interdictions

- Ne pas supprimer `style.css` tant que toutes les vues ne sont pas migrées.
- Ne pas renommer les classes utilisées par le JavaScript sans audit.
- Ne pas modifier le settlement engine.
- Ne pas modifier les formats de stockage.
