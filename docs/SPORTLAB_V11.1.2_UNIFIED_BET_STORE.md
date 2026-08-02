# SportLab V11.1.2 — Unified Bet Store

- `sportlab_bets_v3` est la source unique des paris.
- Migration automatique des anciennes clés de stockage.
- Déduplication et mise à jour d’un pari existant au lieu de créer un doublon.
- Le Journal affiche aussi les paris sans analyse correspondante, notamment ceux saisis directement dans DrawHunter.
- Les KPI du Journal (paris, mises en attente, résultats) reposent désormais directement sur le Bet Store.
- Contrôle d’intégrité disponible via `getBetStoreHealth()`.
