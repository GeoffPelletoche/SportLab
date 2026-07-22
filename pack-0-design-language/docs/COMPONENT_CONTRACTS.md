# Contrats de composants SportLab

## Bouton

Classe racine : `.sl-button`

Variantes :
- `.sl-button-primary`
- `.sl-button-secondary`
- `.sl-button-success`
- `.sl-button-warning`
- `.sl-button-danger`
- `.sl-button-ghost`

États :
- `:hover`
- `:focus-visible`
- `:disabled`
- `.is-loading`

## Carte

Classe racine : `.sl-card`

Variantes :
- `.sl-card-compact`
- `.sl-card-interactive`
- `.sl-card-elevated`

## Panneau

Classe racine : `.sl-panel`

Usage : bloc structurant non nécessairement interactif.

## KPI

Structure :

```html
<article class="sl-kpi-card">
  <span class="sl-kpi-label">Label</span>
  <strong class="sl-kpi-value">Valeur</strong>
</article>
```

## Badge

Classe racine : `.sl-badge`

Variantes sémantiques :
- info
- success
- warning
- danger
- neutral

## Alerte

Structure :

```html
<article class="sl-alert sl-alert-success">
  <strong>Titre</strong>
  <p>Description</p>
</article>
```

## Champ

Structure :

```html
<label class="sl-field">
  <span class="sl-field-label">Libellé</span>
  <input class="sl-input">
  <span class="sl-field-help">Aide</span>
</label>
```

## Table

Toujours utiliser un conteneur scrollable :

```html
<div class="sl-table-wrap">
  <table class="sl-table">...</table>
</div>
```
