export class HttpError extends Error {
  constructor(status, code, message, details = undefined) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...headers }
  });
}

export async function readJson(request, maxBytes = 1_000_000) {
  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > maxBytes) throw new HttpError(413, 'payload_too_large', 'Requête trop volumineuse.');
  let value;
  try { value = await request.json(); }
  catch { throw new HttpError(400, 'invalid_json', 'Corps JSON invalide.'); }
  return value;
}

export function assertString(value, name, { min = 1, max = 200 } = {}) {
  if (typeof value !== 'string') throw new HttpError(400, 'invalid_field', `${name} doit être une chaîne.`);
  const clean = value.trim();
  if (clean.length < min || clean.length > max) throw new HttpError(400, 'invalid_field', `${name} a une longueur invalide.`);
  return clean;
}
