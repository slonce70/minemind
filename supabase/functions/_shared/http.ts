import { apiErrorStatus, GameError } from './error-codes.ts';

export const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Origin': '*',
};

export function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
    status,
  });
}

export function handleCors(request: Request) {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  return null;
}

/** Expected failures keep their code; anything else is logged and hidden behind `server_error`. */
export function errorResponse(error: unknown) {
  if (error instanceof GameError) {
    return jsonResponse({ code: error.code, error: error.message }, apiErrorStatus[error.code]);
  }

  console.error(error);

  return jsonResponse({ code: 'server_error', error: 'Internal error.' }, apiErrorStatus.server_error);
}

export async function requireJsonBody<T>(request: Request): Promise<T> {
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new GameError('invalid_request', 'Expected a JSON object body.');
  }

  return body as T;
}
