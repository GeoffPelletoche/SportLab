# Sprint 7.1.1B — Intégration Cloud SportLab

## Objectif
Cloudflare D1 devient la source de vérité pour les données utilisateur. Le stockage navigateur reste un cache hors ligne.

## Données synchronisées
- analyses ; paris ; workflows DrawHunter et FrenchFlair ; contextes de vues ; réglages V7.
- caches API, diagnostics et secrets API exclus.

## Fonctionnement
- bouton Cloud permanent ; connexion par URL Worker + jeton ; enregistrement automatique de l’appareil ; migration initiale non destructive ; push/pull incrémental ; file hors ligne ; reprise à la reconnexion ; synchronisation toutes les 30 secondes.
- conflit : la version serveur prévaut, puis toute modification locale ultérieure repart dans la file.

## Backend
Routes existantes conservées et ajout de `GET /v1/backup` et `POST /v1/restore`.

## Mise en service
1. appliquer `cloudflare-worker/migrations/0001_initial.sql` dans D1 ;
2. déployer le contenu `cloudflare-worker/src` sur `sportlab-api-bridge` ;
3. créer le premier jeton via `POST /v1/auth/bootstrap` avec `x-setup-secret` ;
4. ouvrir SportLab, cliquer sur le bouton Cloud, coller le jeton et synchroniser.
