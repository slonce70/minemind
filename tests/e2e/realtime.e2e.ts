// Realtime room channel against a LOCAL Supabase (see rooms.e2e.ts for setup).
import assert from 'node:assert/strict';
import test from 'node:test';

import type { RealtimeChannel } from '@supabase/supabase-js';

import { createPlayer, localStack, type TestPlayer } from './helpers';

const stack = localStack();

function waitFor<T>(label: string, register: (resolve: (value: T) => void) => void, timeoutMs = 10_000) {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timed out waiting for ${label}`)), timeoutMs);
    register((value) => {
      clearTimeout(timer);
      resolve(value);
    });
  });
}

function joinRoomChannel(player: TestPlayer, roomId: string) {
  const channel = player.client.channel(`room:${roomId}`, {
    config: { presence: { key: player.id }, private: true },
  });
  const roomUpdates: Array<Record<string, unknown>> = [];
  const answers: Array<Record<string, unknown>> = [];

  channel
    .on('postgres_changes', { event: 'UPDATE', filter: `id=eq.${roomId}`, schema: 'public', table: 'rooms' }, (payload) => {
      roomUpdates.push(payload.new);
    })
    .on('broadcast', { event: 'answer-progress' }, ({ payload }) => {
      answers.push(payload);
    })
    // Realtime only enables presence on channels that listen to it.
    .on('presence', { event: 'sync' }, () => undefined);

  const status = waitFor<string>(`channel status for ${player.id}`, (resolve) => {
    channel.subscribe((value) => {
      if (value !== 'CLOSED') {
        resolve(value);
      }
    });
  });

  return { answers, channel, roomUpdates, status };
}

async function until(label: string, check: () => boolean, timeoutMs = 10_000) {
  const started = Date.now();

  while (!check()) {
    if (Date.now() - started > timeoutMs) {
      throw new Error(`Timed out waiting for ${label}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

test('room channel: members get pushes, outsiders are kept out', async (t) => {
  const host = await createPlayer(stack, 'LiveHost');
  const guest = await createPlayer(stack, 'LiveGuest');
  const outsider = await createPlayer(stack, 'Outsider');
  const created = await host.call('create-room', { difficulty: 'easy', locale: 'en' });
  const roomId = created.body.room.id as string;
  const roomCode = created.body.room.room_code as string;
  await guest.call('join-room', { roomCode });

  const hostChannel = joinRoomChannel(host, roomId);
  const guestChannel = joinRoomChannel(guest, roomId);
  const outsiderChannel = joinRoomChannel(outsider, roomId);
  const channels: RealtimeChannel[] = [hostChannel.channel, guestChannel.channel, outsiderChannel.channel];

  try {
    await t.test('members join the private channel, an outsider is refused', async () => {
      assert.equal(await hostChannel.status, 'SUBSCRIBED');
      assert.equal(await guestChannel.status, 'SUBSCRIBED');
      assert.notEqual(await outsiderChannel.status, 'SUBSCRIBED');
    });

    await t.test('presence shows who is online', async () => {
      await guestChannel.channel.track({ playerId: guest.id });
      await until('guest presence on the host side', () => guest.id in hostChannel.channel.presenceState());
    });

    await t.test('a ready toggle reaches the other member as a room update', async () => {
      const before = hostChannel.roomUpdates.length;
      await guest.call('set-room-ready', { ready: true, roomCode });
      await until('room update after ready toggle', () => hostChannel.roomUpdates.length > before);
    });

    await t.test('the round start and each answer are pushed', async () => {
      const started = await host.call('start-room-round', { locale: 'en', roomCode });
      assert.equal(started.status, 200, JSON.stringify(started.body));
      await until('round-started update', () =>
        guestChannel.roomUpdates.some((room) => room.current_round_id === started.body.round.id)
      );

      const question = started.body.questions[0];
      await host.call('submit-answer', { phase: 'open', questionId: question.id, roundId: started.body.round.id });
      await host.call('submit-answer', { questionId: question.id, roundId: started.body.round.id, selectedOption: 0 });
      await until('answer progress broadcast', () =>
        guestChannel.answers.some((event) => event.playerId === host.id && event.questionId === question.id)
      );
      assert.ok(outsiderChannel.answers.length === 0);
    });
  } finally {
    await Promise.all(channels.map((channel) => channel.unsubscribe()));
    await Promise.all([host, guest, outsider].map((player) => player.client.removeAllChannels()));
  }
});
