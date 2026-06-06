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

export async function requireJsonBody<T>(request: Request): Promise<T> {
  const body = await request.json();

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new Error('Expected a JSON object body.');
  }

  return body as T;
}
