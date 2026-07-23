import { randomBytes } from 'node:crypto';
for (const name of ['SETUP_SECRET', 'TOKEN_PEPPER']) {
  console.log(`${name}=${randomBytes(32).toString('base64url')}`);
}
