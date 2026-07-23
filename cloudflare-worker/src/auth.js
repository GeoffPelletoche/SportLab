import { HttpError } from './http.js';

const encoder = new TextEncoder();

function toHex(buffer) {
  return [...new Uint8Array(buffer)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function hashToken(token, pepper) {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(`${pepper}:${token}`));
  return toHex(digest);
}

export function createToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

export function requireSecret(value, expected, label = 'secret') {
  if (!expected || value !== expected) throw new HttpError(401, 'unauthorized', `${label} invalide.`);
}

export async function authenticate(request, env) {
  const header = request.headers.get('authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) throw new HttpError(401, 'missing_token', 'Jeton Bearer requis.');
  if (!env.TOKEN_PEPPER) throw new HttpError(500, 'server_misconfigured', 'TOKEN_PEPPER absent.');
  const tokenHash = await hashToken(match[1], env.TOKEN_PEPPER);
  const user = await env.DB.prepare(
    'SELECT id, display_name FROM users WHERE token_hash = ?1 AND disabled_at IS NULL'
  ).bind(tokenHash).first();
  if (!user) throw new HttpError(401, 'invalid_token', 'Jeton invalide.');
  return user;
}
