import assert from 'node:assert/strict';
import test from 'node:test';

import { createDefaultRoomMatchSettings } from '../src/features/rooms/room-match-settings';
import { deriveRoomLobbyState } from '../src/features/rooms/room-lobby-state';

test('room lobby state exposes a dominant room code and ready summary', () => {
  const state = deriveRoomLobbyState({
    createdAt: new Date().toISOString(),
    participants: [
      { id: '1', name: 'BlockFox', ready: true, isHost: true, isLocalPlayer: true, avatarId: 'fox' },
      { id: '2', name: 'PixelBee', ready: false, isHost: false, isLocalPlayer: false, avatarId: 'bee' },
    ],
    roomCode: 'AB12CD',
    settings: createDefaultRoomMatchSettings(),
    status: 'lobby',
  });

  assert.equal(state.readyCount, 1);
  assert.equal(state.canStart, false);
});
