# Déploiement Cloudflare — dash.cloudflare.com

## 1. Préparer le projet

Dans le dossier `cloudflare-worker` :

```bash
npm install
npm run check
npm test
```

## 2. Se connecter à Cloudflare

```bash
npx wrangler login
```

## 3. Créer D1 en juridiction UE

```bash
npx wrangler d1 create sportlab-sync-db --jurisdiction eu
```

Copier le `database_id` renvoyé dans `wrangler.jsonc`, à la place de `REPLACE_WITH_D1_DATABASE_ID`.

Dans le tableau de bord, la base se trouve dans **Workers & Pages > D1 SQL Database**.

## 4. Configurer l’origine GitHub Pages

Modifier `ALLOWED_ORIGINS` dans `wrangler.jsonc`, par exemple :

```json
"ALLOWED_ORIGINS": "https://geoffpelletoche.github.io"
```

Plusieurs origines peuvent être séparées par des virgules.

## 5. Générer et enregistrer les secrets

```bash
node scripts/generate-secrets.mjs
npx wrangler secret put SETUP_SECRET
npx wrangler secret put TOKEN_PEPPER
```

Les deux valeurs doivent être différentes et conservées dans un gestionnaire de mots de passe. Elles ne doivent jamais être ajoutées au dépôt.

## 6. Appliquer la migration

```bash
npm run db:migrate:remote
```

## 7. Déployer

```bash
npm run deploy
```

Le Worker est alors visible dans **Workers & Pages** sur dash.cloudflare.com. Un domaine personnalisé peut être ajouté dans **Settings > Domains & Routes**.

## 8. Vérifier

```bash
curl https://VOTRE-WORKER.workers.dev/health
```

## 9. Créer le compte SportLab une seule fois

```bash
curl -X POST https://VOTRE-WORKER.workers.dev/v1/auth/bootstrap \
  -H 'content-type: application/json' \
  -H 'x-setup-secret: VOTRE_SETUP_SECRET' \
  --data '{"displayName":"Geoffrey"}'
```

La réponse contient le jeton utilisateur une seule fois. Le conserver dans un gestionnaire sécurisé. Le Sprint 7.1.1B fournira son enregistrement dans SportLab.

## Dashboard uniquement

Le code peut aussi être importé depuis un dépôt GitHub dans **Workers & Pages > Create > Import a repository**. La liaison D1 doit alors utiliser le nom `DB`, et les secrets `SETUP_SECRET` et `TOKEN_PEPPER` doivent être ajoutés dans **Settings > Variables and Secrets**. La migration SQL reste à appliquer avec Wrangler ou depuis la console D1.
