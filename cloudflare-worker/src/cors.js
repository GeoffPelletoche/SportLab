import { HttpError } from './http.js';

export function allowedOrigin(request, env) {
  const origin = request.headers.get('origin');
  if (!origin) return null;
  const allowed = String(env.ALLOWED_ORIGINS || '')
    .split(',').map(value => value.trim()).filter(Boolean);
  if (!allowed.includes(origin)) throw new HttpError(403, 'origin_not_allowed', 'Origine non autorisée.');
  return origin;
}

export function corsHeaders(origin) {
  if (!origin) return {};
  return {
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'authorization,content-type,x-setup-secret',
    'access-control-max-age': '86400',
    'vary': 'Origin'
  };
}
