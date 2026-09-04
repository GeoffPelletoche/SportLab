import { allowedOrigin, corsHeaders } from './cors.js';
import { HttpError, json } from './http.js';
import { route } from './router.js';

export default {
  async fetch(request, env) {
    let origin = null;
    try {
      origin = allowedOrigin(request, env);
      if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(origin) });
      const response = await route(request, env);
      const headers = new Headers(response.headers);
      Object.entries(corsHeaders(origin)).forEach(([key, value]) => headers.set(key, value));
      headers.set('cache-control', 'no-store');
      headers.set('x-content-type-options', 'nosniff');
      headers.set('referrer-policy', 'no-referrer');
      return new Response(response.body, { status: response.status, headers });
    } catch (error) {
      const known = error instanceof HttpError;
      const rawMessage = error instanceof Error ? error.message : String(error);
      const quota = /D1.*(free tier|daily).*(row read|row write)|exceeded D1.*daily row/i.test(rawMessage);
      const status = quota ? 429 : (known ? error.status : 500);
      const code = quota ? 'd1_daily_quota_exceeded' : (known ? error.code : 'internal_error');
      const message = quota
        ? 'Quota quotidienne D1 dépassé. Vérifie les Row Metrics Cloudflare : lectures/écritures.'
        : (known ? error.message : 'Erreur interne.');
      if (!known && !quota) console.error('Unhandled worker error', error);
      return json({ error: { code, message, details: known ? error.details : undefined } }, status, { ...corsHeaders(origin), 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer' });
    }
  }
};
