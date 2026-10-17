// Account data rights against a LOCAL Supabase: export everything, report a question, delete it all.
import assert from 'node:assert/strict';
import test from 'node:test';

import { supabaseProgressRemote, syncProgressWith } from '../../src/features/progress/cloud-sync';
import { createEmptyProgress } from '../../src/features/progress/progression';
import { adminClient, createPlayer, localStack } from './helpers';

const stack = localStack();
const admin = adminClient(stack);

test('a player can report a question with a reason from the list only', async () => {
  const player = await createPlayer(stack, 'CarefulOwl');
  const reported = await player.call('report-question', { locale: 'uk', questionId: 'bone-tames-wolf', reason: 'outdated' });
  assert.equal(reported.status, 200, JSON.stringify(reported.body));

  const badReason = await player.call('report-question', { questionId: 'bone-tames-wolf', reason: 'you are wrong!!' });
  assert.equal(badReason.body.code, 'invalid_request');
  const unknown = await player.call('report-question', { questionId: 'no-such-question', reason: 'typo' });
  assert.equal(unknown.body.code, 'invalid_request');

  const direct = await player.client.from('question_reports').select('id');
  assert.deepEqual(direct.data ?? [], [], 'reports are not readable by players');
});

test('export returns the player’s own data and deletion removes all of it', async () => {
  const player = await createPlayer(stack, 'LeavingFox');
  const other = await createPlayer(stack, 'StayingBee');
  await syncProgressWith(supabaseProgressRemote(player.client, player.id), { ...createEmptyProgress(new Date()), xp: 90 });
  await player.call('report-question', { locale: 'en', questionId: 'bone-tames-wolf', reason: 'typo' });
  const room = await other.call('create-room', { difficulty: 'easy', locale: 'en' });
  await player.call('join-room', { roomCode: room.body.room.room_code });

  const exported = await player.call('export-my-data', {});
  assert.equal(exported.status, 200, JSON.stringify(exported.body));
  assert.equal(exported.body.account.id, player.id);
  assert.equal(exported.body.profile.nickname, 'LeavingFox');
  assert.equal(exported.body.progress.xp, 90);
  assert.equal(exported.body.questionReports.length, 1);
  assert.equal(exported.body.roomPlaces.length, 1);
  assert.ok(!JSON.stringify(exported.body).includes(other.id), 'nothing about other players');

  const unconfirmed = await player.call('delete-account', {});
  assert.equal(unconfirmed.body.code, 'invalid_request');

  const deleted = await player.call('delete-account', { confirm: 'delete-everything' });
  assert.equal(deleted.status, 200, JSON.stringify(deleted.body));

  for (const [table, column] of [
    ['guest_profiles', 'id'],
    ['player_progress', 'user_id'],
    ['room_participants', 'player_id'],
    ['question_reports', 'player_id'],
    ['rate_limit_hits', 'player_id'],
  ] as const) {
    const { count } = await admin.from(table).select('*', { count: 'exact', head: true }).eq(column, player.id);
    assert.equal(count, 0, `${table} still has rows`);
  }

  const { data: user } = await admin.auth.admin.getUserById(player.id);
  assert.equal(user.user, null);
  const afterwards = await player.call('export-my-data', {});
  assert.equal(afterwards.status, 401, 'the old session no longer works');

  const { count: otherRoom } = await admin.from('rooms').select('*', { count: 'exact', head: true }).eq('host_id', other.id);
  assert.equal(otherRoom, 1, 'other players keep their rooms');
});
