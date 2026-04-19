import test from 'node:test';
import assert from 'node:assert/strict';

import {
  addDemoParticipants,
  createOfflineRoom,
  createRoomStandings,
  joinOfflineRoom,
  startOfflineRoom,
  toggleLocalReady,
} from '../src/features/rooms/demo-room-service';
import type { GuestProfile } from '../src/state/app-store';

const profile: GuestProfile = {
  avatarId: 'fox',
  locale: 'uk',
  nickname: 'BlockFox',
};

test('createOfflineRoom seeds a host-only lobby', () => {
  const room = createOfflineRoom(profile);

  assert.equal(room.status, 'lobby');
  assert.equal(room.participants.length, 1);
  assert.equal(room.participants[0].isHost, true);
  assert.equal(room.participants[0].isLocalPlayer, true);
});

test('joinOfflineRoom creates a joined lobby with existing host', () => {
  const room = joinOfflineRoom(profile, 'ab12cd');

  assert.equal(room.roomCode, 'AB12CD');
  assert.equal(room.participants.length, 3);
  assert.equal(room.participants.some((participant) => participant.isHost), true);
  assert.equal(room.participants.some((participant) => participant.isLocalPlayer), true);
});

test('room flow adds demo players, toggles ready, and returns sorted standings', () => {
  const seededRoom = createOfflineRoom(profile);
  const fullRoom = addDemoParticipants(seededRoom, 4);
  const toggledRoom = toggleLocalReady(fullRoom);
  const standings = createRoomStandings(toggledRoom, 620);

  assert.equal(fullRoom.participants.length, 4);
  assert.equal(toggledRoom.participants[0].ready, false);
  assert.equal(standings[0].score >= standings[1].score, true);
  assert.equal(standings.some((entry) => entry.isPlayer), true);
});

test('startOfflineRoom keeps the room in lobby until every participant is ready', () => {
  const seededRoom = createOfflineRoom(profile);
  const fullRoom = addDemoParticipants(seededRoom, 4);
  const notReadyRoom = toggleLocalReady(fullRoom);
  const attemptedStart = startOfflineRoom(notReadyRoom);

  assert.equal(notReadyRoom.participants[0].ready, false);
  assert.equal(attemptedStart.status, 'lobby');
});
