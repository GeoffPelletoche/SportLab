# SportLab Cloud Sync Worker — Sprint 7.1.1A

Infrastructure autonome Cloudflare Worker + D1. Ce sprint prépare le cloud mais ne branche pas encore l’application SportLab au Worker : cette intégration appartient au Sprint 7.1.1B.

## API livrée

- `GET /health`
- `POST /v1/auth/bootstrap` (une seule fois, protégé par `X-Setup-Secret`)
- `GET /v1/me`
- `POST /v1/devices`
- `POST /v1/sync/push`
- `GET /v1/sync/pull?cursor=0&limit=200`
- `GET /v1/sync/snapshot`

## Sécurité

- jeton Bearer stocké uniquement sous forme de hash SHA-256 salé par `TOKEN_PEPPER` ;
- secrets exclusivement via Cloudflare Secrets ;
- CORS limité à la ou aux origines GitHub Pages autorisées ;
- bootstrap impossible après création du premier utilisateur ;
- aucun secret dans Git ou dans `wrangler.jsonc`.

Consulter `../docs/SPRINT7.1.1A_CLOUDFLARE_DEPLOYMENT.md` pour le déploiement pas à pas via dash.cloudflare.com et Wrangler.
