import assert from 'node:assert/strict';
import test from 'node:test';

import { requireJsonBody } from '../supabase/functions/_shared/http.ts';

test('requireJsonBody accepts JSON object payloads', async () => {
  const request = new Request('https://edge.local/create-room', {
    body: JSON.stringify({ roomCode: 'ABCD12' }),
    headers: { 'content-type': 'application/json' },
    method: 'POST',
  });

  const body = await requireJsonBody<{ roomCode: string }>(request);

  assert.deepEqual(body, { roomCode: 'ABCD12' });
});

test('requireJsonBody rejects non-object JSON payloads', async () => {
  const request = new Request('https://edge.local/create-room', {
    body: JSON.stringify(['ABCD12']),
    headers: { 'content-type': 'application/json' },
    method: 'POST',
  });

  await assert.rejects(() => requireJsonBody(request), /Expected a JSON object body/);
});
