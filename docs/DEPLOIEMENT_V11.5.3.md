# SportLab V11.5.3 — Sync V2 Safari Storage Recovery

Cette version corrige le cas observé sur iPhone où `localStorage.setItem()` lève `QuotaExceededError` avant tout appel au Worker Cloudflare.

## Déploiement
Remplacer le contenu du dépôt SportLab par cette archive complète puis publier GitHub Pages comme d’habitude. Aucun changement du Worker Cloudflare ni de la base D1 n’est requis.

## Après déploiement
Sur l’iPhone, recharger SportLab puis lancer une seule synchronisation manuelle. La file existante est envoyée en priorité si la recapture locale manque d’espace. Ne pas effacer les données Safari avant validation de la synchronisation.
