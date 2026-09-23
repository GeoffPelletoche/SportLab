# SportLab V11.4.0 — NFL Sprint 0.1

## 1. GitHub Pages
Remplacer le contenu du dépôt par cette archive puis pousser sur `main`.

## 2. API Bridge Cloudflare
Déployer `cloudflare-worker/sportlab-api-bridge-v3.11.0.js` à la place du Bridge 3.10.1.
La même variable secrète `API_SPORTS_KEY` est utilisée : API-Sports indique qu’une même clé de compte fonctionne pour les sports auxquels le compte est abonné. Ne jamais mettre cette clé dans GitHub Pages.

## 3. Vérification
- `/version` doit répondre `3.11.0`.
- `/health` doit afficher `nfl: READY`.
- Dans SportLab, ouvrir `NFL Data`.
- Les matchs J/J+1 doivent apparaître progressivement, puis les compteurs d’historique doivent se remplir.

## Portée du Sprint 0.1
Données NFL seulement : calendrier, équipes, historique glissant jusqu’à 30 matchs officiels. Les matchs de présaison sont exclus. Aucun modèle Over/Under, aucune VALUE et aucun pari NFL ne sont encore activés.
