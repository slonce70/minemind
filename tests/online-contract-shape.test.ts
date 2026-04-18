import assert from 'node:assert/strict';
import test from 'node:test';

import { createDefaultRoomMatchSettings } from '../src/features/rooms/room-match-settings';
import type { ActiveRoom } from '../src/features/rooms/types';

test('active room shape carries explicit settings for future online contracts', () => {
  const room: ActiveRoom = {
    createdAt: new Date().toISOString(),
    participants: [],
    roomCode: 'AB12CD',
    settings: createDefaultRoomMatchSettings('hard'),
    status: 'lobby',
  };

  assert.equal(room.settings.difficulty, 'hard');
  assert.equal(room.settings.contentPackVersion, 'minecraft-v1');
  assert.equal(room.settings.questionCount, 8);
});
