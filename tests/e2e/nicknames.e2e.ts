// Nickname rules against a LOCAL Supabase (see rooms.e2e.ts for setup): the Edge Function and the
// SQL check agree with the shared rules.
import assert from 'node:assert/strict';
import test from 'node:test';

import { createPlayer, localStack } from './helpers';

const stack = localStack();
const allowed = ['Modern Fox', 'Essex', 'Commodore', 'Сміливий Лис', 'Небанальний', 'Страхуя'];
const blocked = ['ModKing', 'admin_1', 'Sh1t', 'Хуй', 'Mod King'];

test('sync-profile accepts names that only contain a blocked word and rejects real ones', async () => {
  const player = await createPlayer(stack, 'NickCheck');

  for (const nickname of allowed) {
    const result = await player.call('sync-profile', { avatarId: 'owl', locale: 'uk', nickname });

    assert.equal(result.status, 200, `${nickname}: ${JSON.stringify(result.body)}`);
  }

  for (const nickname of blocked) {
    const result = await player.call('sync-profile', { avatarId: 'owl', locale: 'uk', nickname });

    assert.equal(result.status, 400, nickname);
    assert.equal(result.body.code, 'invalid_nickname', nickname);
  }
});

test('the SQL nickname check matches the shared rules', async () => {
  const player = await createPlayer(stack, 'SqlCheck');

  for (const [candidate, expected] of [...allowed.map((name) => [name, true] as const), ...blocked.map((name) => [name, false] as const)]) {
    const { data, error } = await player.client.rpc('nickname_is_allowed', { candidate });

    assert.equal(error, null);
    assert.equal(data, expected, candidate);
  }
});
