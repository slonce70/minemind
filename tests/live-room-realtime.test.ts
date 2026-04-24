import assert from 'node:assert/strict';
import test from 'node:test';

import { collectRoomRealtimeEvents } from '../src/features/rooms/realtime-room-channel';

test('room realtime channel emits room-updated and round-started events through one adapter', () => {
  const events = collectRoomRealtimeEvents([
    {
      current_round_id: null,
      room_code: 'AB12CD',
      status: 'lobby',
    },
    {
      current_round_id: 'round-1',
      room_code: 'AB12CD',
      status: 'active',
    },
  ]);

  assert.deepEqual(events, ['room-updated', 'round-started']);
});
