// Account data rights against a LOCAL Supabase: export everything, report a question, delete it all.
import assert from 'node:assert/strict';
import test from 'node:test';

import { supabaseProgressRemote, syncProgressWith } from '../../src/features/progress/cloud-sync';
import { createEmptyProgress } from '../../src/features/progress/progression';
import { adminClient, createPlayer, localStack, openQuestion } from './helpers';

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

test('when the host deletes their account, the earliest-joined player takes the room over', async () => {
  const host = await createPlayer(stack, 'GoneHost', 'en');
  const early = await createPlayer(stack, 'EarlyOwl', 'en');
  const late = await createPlayer(stack, 'LateCat', 'en');
  const created = await host.call('create-room', { difficulty: 'easy', locale: 'en' });
  const roomCode = created.body.room.room_code as string;
  await host.call('update-room-settings', { difficulty: 'easy', roomCode, screenMode: true });
  await early.call('join-room', { roomCode });
  await late.call('join-room', { roomCode });

  // A finished match the host played with the others: their answers must survive the deletion.
  await early.call('set-room-ready', { ready: true, roomCode });
  await late.call('set-room-ready', { ready: true, roomCode });
  const started = await host.call('start-room-round', { locale: 'en', roomCode });
  assert.equal(started.status, 200, JSON.stringify(started.body));
  const round = started.body.round;
  await openQuestion(admin, round, 0);
  const view = await early.call('get-room-round', { locale: 'en', roomCode });
  await early.call('submit-answer', { questionId: view.body.questions[0].id, roundId: round.id, selectedOption: 0 });
  await admin.from('round_sessions').update({ ends_at: new Date(Date.now() - 1000).toISOString() }).eq('id', round.id);
  const done = await early.call('finalize-round', { roundId: round.id });
  assert.equal(done.body.status, 'completed', JSON.stringify(done.body));

  const deleted = await host.call('delete-account', { confirm: 'delete-everything' });
  assert.equal(deleted.status, 200, JSON.stringify(deleted.body));

  const state = await late.call('get-room-state', { roomCode });
  assert.equal(state.status, 200, JSON.stringify(state.body));
  assert.equal(state.body.room.host_id, early.id, 'the earliest-joined player is the host now');
  assert.equal(state.body.room.screen_mode, false, 'the big screen left with the old host');
  assert.notEqual(state.body.room.status, 'finished');
  assert.deepEqual(
    state.body.participants.map((entry: { player_id: string }) => entry.player_id),
    [early.id, late.id]
  );

  const { count: answers } = await admin
    .from('answer_submissions')
    .select('*', { count: 'exact', head: true })
    .eq('round_id', round.id)
    .eq('player_id', early.id);
  assert.equal(answers, 1, 'the others keep their match history');

  await early.call('set-room-ready', { ready: true, roomCode });
  await late.call('set-room-ready', { ready: true, roomCode });
  const next = await early.call('start-room-round', { locale: 'en', roomCode });
  assert.equal(next.status, 200, `the new host can start: ${JSON.stringify(next.body)}`);
});

test('a room its host was alone in is closed with a reason instead of vanishing', async () => {
  const host = await createPlayer(stack, 'LonelyHost', 'en');
  const created = await host.call('create-room', { difficulty: 'easy', locale: 'en' });
  const roomId = created.body.room.id as string;

  await host.call('delete-account', { confirm: 'delete-everything' });

  const { data: room } = await admin.from('rooms').select('status, closed_reason, host_id').eq('id', roomId).single();
  assert.deepEqual(room, { closed_reason: 'host-deleted', host_id: null, status: 'finished' });
});
