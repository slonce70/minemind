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

  assert.match(source, /useRoomChannel/);
  assert.match(source, /refreshLiveRoom/);
});

test('room sync is keyed by room code, not by the polled room object', () => {
  const source = readFileSync(new URL('../src/features/rooms/use-room-lobby.ts', import.meta.url), 'utf8');
  const channelSource = readFileSync(new URL('../src/features/rooms/use-room-channel.ts', import.meta.url), 'utf8');

  assert.match(source, /\}, \[activeRoomCode, clearActiveRound, setActiveRoom, setActiveRoomRound\]\);/);
  assert.match(source, /\}, \[activeRoomCode, isChannelLive, syncRoomState\]\);/);
  assert.doesNotMatch(source, /\}, \[activeRoom, activeRoomRound,/);
  // The channel subscription depends only on primitives, so re-polled room objects never resubscribe.
  assert.match(channelSource, /\}, \[localPlayerId, nickname, roomCode, roomId\]\);/);
});

test('polling is only a fallback while the realtime channel is live', () => {
  const source = readFileSync(new URL('../src/features/rooms/use-room-lobby.ts', import.meta.url), 'utf8');

  assert.match(source, /useRoomChannel\(/);
  assert.match(source, /isChannelLive \? LIVE_POLL_INTERVAL_MS : OFFLINE_POLL_INTERVAL_MS/);
});

test('bots and invented room players are development-only', async () => {
  const { isDemoPlayersEnabled } = await import('../src/lib/dev-flags');
  const source = readFileSync(new URL('../src/features/rooms/use-room-lobby.ts', import.meta.url), 'utf8');

  // Outside React Native dev mode (as in a release bundle) the flag is off.
  assert.equal(isDemoPlayersEnabled, false);
  assert.match(source, /addDemoPlayersToRoom: isDemoPlayersEnabled \? addDemoPlayersToRoom : undefined/);
  assert.match(source, /\} else if \(isDemoPlayersEnabled\) \{\n\s+joinRoom\(roomCode\);/);
  assert.match(source, /\} else if \(isDemoPlayersEnabled\) \{\n\s+createRoom\(\);/);
});

test('big screen rooms leave the host out of readiness and allow one player', () => {
  const room = {
    participants: [
      { isHost: true, ready: false },
      { isHost: false, ready: true },
    ],
    roomCode: 'TV1234',
    settings: { ...createDefaultRoomMatchSettings(), screenMode: true },
    status: 'lobby' as const,
  };

  assert.deepEqual(
    { canStart: true, participantCount: 1, readyCount: 1 },
    (({ canStart, participantCount, readyCount }) => ({ canStart, participantCount, readyCount }))(deriveRoomLobbyState(room))
  );
  assert.equal(deriveRoomLobbyState({ ...room, settings: createDefaultRoomMatchSettings() }).canStart, false);
});
