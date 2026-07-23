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
      const status = known ? error.status : 500;
      if (!known) console.error('Unhandled worker error', error);
      return json({ error: { code: known ? error.code : 'internal_error', message: known ? error.message : 'Erreur interne.', details: known ? error.details : undefined } }, status, { ...corsHeaders(origin), 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' });
    }
  }
};
