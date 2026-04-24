import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
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

test('room lobby start action is visually disabled until the lobby can start', () => {
  const lobbySource = readFileSync(new URL('../src/features/rooms/room-lobby-view.tsx', import.meta.url), 'utf8');
  const buttonSource = readFileSync(new URL('../src/components/ui/button.tsx', import.meta.url), 'utf8');

  assert.match(lobbySource, /const isStartDisabled = isBusy \|\| \(!canResumeRound && !lobbyState\?\.canStart\);/);
  assert.match(lobbySource, /<PrimaryButton[\s\S]*disabled=\{isStartDisabled\}/);
  assert.match(buttonSource, /disabled && styles\.disabled/);
  assert.match(buttonSource, /disabled && styles\.disabledLabel/);
});

test('room lobby uses realtime subscription as the primary sync path', () => {
  const source = readFileSync(new URL('../src/features/rooms/use-room-lobby.ts', import.meta.url), 'utf8');

  assert.match(source, /subscribeToRoomChannel/);
  assert.match(source, /refreshLiveRoom/);
});
