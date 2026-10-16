// Room limits against a LOCAL Supabase (see rooms.e2e.ts for setup).
import assert from 'node:assert/strict';
import test from 'node:test';

import { adminClient, createPlayer, localStack, openQuestion } from './helpers';

const stack = localStack();
const admin = adminClient(stack);

test('room creation is rate limited per player', async () => {
  const player = await createPlayer(stack, 'BusyBee');
  const statuses: number[] = [];

  for (let attempt = 0; attempt < 6; attempt += 1) {
    statuses.push((await player.call('create-room', { difficulty: 'easy', locale: 'en' })).status);
  }

  assert.deepEqual(statuses.slice(0, 5), [200, 200, 200, 200, 200]);
  assert.equal(statuses[5], 429);
});

test('a room never holds more than 8 players, even when joins race', async () => {
  const host = await createPlayer(stack, 'CapHost');
  const created = await host.call('create-room', { difficulty: 'easy', locale: 'en' });
  const roomCode = created.body.room.room_code as string;
  const joiners = await Promise.all(Array.from({ length: 8 }, (_, index) => createPlayer(stack, `Joiner${index}`)));
  const results = await Promise.all(joiners.map((joiner) => joiner.call('join-room', { roomCode })));

  assert.equal(results.filter((result) => result.status === 200).length, 7);
  assert.deepEqual(
    results.filter((result) => result.status !== 200).map((result) => result.body.code),
    ['room_full']
  );

  const { count } = await admin
    .from('room_participants')
    .select('player_id', { count: 'exact', head: true })
    .eq('room_id', created.body.room.id);
  assert.equal(count, 8);

  // A member re-joining a full room is not a new player.
  const rejoin = await joiners[results.findIndex((result) => result.status === 200)].call('join-room', { roomCode });
  assert.equal(rejoin.status, 200, JSON.stringify(rejoin.body));
});

test('abandoned rooms are closed, not deleted', async () => {
  const host = await createPlayer(stack, 'GoneHost');
  const late = await createPlayer(stack, 'LateFox');
  const created = await host.call('create-room', { difficulty: 'easy', locale: 'en' });
  const roomId = created.body.room.id as string;

  await admin.rpc('close_abandoned_rooms');
  assert.equal((await admin.from('rooms').select('status').eq('id', roomId).single()).data?.status, 'lobby');

  await admin.from('rooms').update({ last_activity_at: new Date(Date.now() - 3 * 3600_000).toISOString() }).eq('id', roomId);
  await admin.rpc('close_abandoned_rooms');
  assert.equal((await admin.from('rooms').select('status').eq('id', roomId).single()).data?.status, 'finished');

  const joined = await late.call('join-room', { roomCode: created.body.room.room_code });
  assert.equal(joined.body.code, 'room_closed');
});

test('the last player leaving closes the room but keeps it', async () => {
  const host = await createPlayer(stack, 'LoneHost');
  const created = await host.call('create-room', { difficulty: 'easy', locale: 'en' });
  const roomId = created.body.room.id as string;
  const left = await host.call('leave-room', { roomCode: created.body.room.room_code });

  assert.equal(left.body.roomClosed, true);
  assert.equal((await admin.from('rooms').select('status').eq('id', roomId).single()).data?.status, 'finished');
});

test('a reconnecting player gets their answers back', async () => {
  const host = await createPlayer(stack, 'BackHost', 'en');
  const guest = await createPlayer(stack, 'BackGuest', 'en');
  const created = await host.call('create-room', { difficulty: 'easy', locale: 'en' });
  const roomCode = created.body.room.room_code as string;
  await guest.call('join-room', { roomCode });
  await guest.call('set-room-ready', { ready: true, roomCode });
  const started = await host.call('start-room-round', { locale: 'en', roomCode });
  await openQuestion(admin, started.body.round, 0);
  const first = { id: started.body.round.question_ids[0] as string };
  const answer = await guest.call('submit-answer', { questionId: first.id, roundId: started.body.round.id, selectedOption: 2 });

  const resumed = await guest.call('get-room-round', { locale: 'en', roomCode });
  assert.deepEqual(
    resumed.body.myAnswers.map((entry: { questionId: string; selectedOption: number; isCorrect: boolean; correctOption: number }) => ({
      correctOption: entry.correctOption,
      isCorrect: entry.isCorrect,
      questionId: entry.questionId,
      selectedOption: entry.selectedOption,
    })),
    [{ correctOption: answer.body.correctOption, isCorrect: answer.body.isCorrect, questionId: first.id, selectedOption: 2 }],
    'only answered questions, in display order'
  );
});
