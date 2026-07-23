# SportLab V7.0.1 — Sprint 7.1.1A Cloud Sync Infrastructure

Cette livraison ajoute une infrastructure Cloudflare autonome et déployable : Worker API, base D1, authentification mono-utilisateur, appareils, synchronisation incrémentale et gestion explicite des conflits.

## État de la migration

- SportLab V7 Core reste pleinement opérationnel.
- Les moteurs DrawHunter, FrenchFlair, VALUE, ROI et settlement sont inchangés.
- Le runtime client utilise encore ses stores V7/V6.5.3.
- Le cloud n’est pas encore branché à l’application : cette étape appartient au Sprint 7.1.1B.

## Dossiers principaux

- `cloudflare-worker/` : projet Worker + D1 prêt à déployer.
- `docs/SPRINT7.1.1A_CLOUDFLARE_DEPLOYMENT.md` : procédure dashboard/CLI.
- `docs/SPRINT7.1.1A_CLOUD_SYNC_FOUNDATION.md` : architecture et contrat de synchronisation.
- `docs/SPRINT7.1.1A_VALIDATION.md` : contrôles effectués.
