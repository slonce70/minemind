import assert from 'node:assert/strict';
import test from 'node:test';

import { createClient } from '@supabase/supabase-js';

import { supabaseProgressRemote, syncProgressWith } from '../../src/features/progress/cloud-sync';
import { createEmptyProgress, type PlayerProgress } from '../../src/features/progress/progression';
import { createPlayer, localStack } from './helpers';

const stack = localStack();
const mailpit = stack.url.replace(':54321', ':54324');

const progressWith = (xp: number, cards: Record<string, number> = {}): PlayerProgress => ({
  ...createEmptyProgress(new Date('2026-10-17T10:00:00Z')),
  cards,
  xp,
});

test('progress syncs to the cloud, only for its owner, and never goes backwards', async () => {
  const alice = await createPlayer(stack, 'ProgressAlice');
  const bob = await createPlayer(stack, 'ProgressBob');
  const remote = supabaseProgressRemote(alice.client, alice.id);

  const first = await syncProgressWith(remote, progressWith(150, { sprout: 1 }));
  assert.equal(first.xp, 150);

  // Another device of Alice's with less XP but a different card: the merge keeps both.
  const second = await syncProgressWith(remote, progressWith(40, { miner: 1 }));
  assert.equal(second.xp, 150);
  assert.deepEqual(second.cards, { miner: 1, sprout: 1 });

  const { data: bobView } = await bob.client.from('player_progress').select('user_id').eq('user_id', alice.id);
  assert.deepEqual(bobView, [], 'players cannot read each other’s progress');

  const { data: bobWrite } = await bob.client
    .from('player_progress')
    .update({ xp: 1 })
    .eq('user_id', alice.id)
    .select('user_id');
  assert.deepEqual(bobWrite, [], 'players cannot change each other’s progress');

  const { error: backwards } = await alice.client.from('player_progress').update({ xp: 10 }).eq('user_id', alice.id);
  assert.ok(backwards, 'XP cannot go down');

  const { error: forged } = await bob.client.from('player_progress').insert({ progress: {}, user_id: alice.id, xp: 9999 });
  assert.ok(forged, 'nobody can create a row for someone else');
});

async function latestMailLink(to: string) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const list = (await (await fetch(`${mailpit}/api/v1/search?query=${encodeURIComponent(`to:${to}`)}`)).json()) as {
      messages: { ID: string }[];
    };

    if (list.messages.length > 0) {
      const message = (await (await fetch(`${mailpit}/api/v1/message/${list.messages[0].ID}`)).json()) as { HTML: string; Text: string };
      const link = (message.Text + message.HTML).match(/https?:\/\/[^\s"'<>]+\/auth\/v1\/verify[^\s"'<>]+/)?.[0];

      if (link) {
        return link.replace(/&amp;/g, '&');
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`No email for ${to}`);
}

test('a guest links an email and restores the same progress on a new device', async () => {
  const guest = await createPlayer(stack, 'ProgressGuest');
  const email = `kid-${Date.now()}@example.test`;

  await syncProgressWith(supabaseProgressRemote(guest.client, guest.id), progressWith(420, { pebble: 3 }));

  const { data: linked, error: linkError } = await guest.client.auth.updateUser(
    { email },
    { emailRedirectTo: 'http://localhost:8081/auth' }
  );
  assert.ifError(linkError);

  // With email confirmations on (hosted default) the change waits for the emailed link.
  if (linked.user?.email !== email) {
    await fetch(await latestMailLink(email), { redirect: 'manual' });
  }

  // New device: sign in with a magic link (no new account), then sync.
  const device = createClient(stack.url, stack.anonKey, { auth: { persistSession: false } });
  await fetch(`${mailpit}/api/v1/messages`, { method: 'DELETE' });
  const { error: otpError } = await device.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: 'http://localhost:8081/auth', shouldCreateUser: false },
  });
  assert.ifError(otpError);

  const verify = await fetch(await latestMailLink(email), { redirect: 'manual' });
  const location = verify.headers.get('location') ?? '';
  const params = new URLSearchParams(location.split('#')[1] ?? '');

  assert.ok(location.startsWith('http://localhost:8081/auth'), location);
  const { data: session, error } = await device.auth.setSession({
    access_token: params.get('access_token') ?? '',
    refresh_token: params.get('refresh_token') ?? '',
  });
  assert.ifError(error);
  assert.equal(session.user?.id, guest.id, 'the same player, now with an email');

  const restored = await syncProgressWith(supabaseProgressRemote(device, guest.id), createEmptyProgress());
  assert.equal(restored.xp, 420);
  assert.deepEqual(restored.cards, { pebble: 3 });
});
