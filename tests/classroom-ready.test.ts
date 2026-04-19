import assert from 'node:assert/strict';
import test from 'node:test';

import { applyClassroomTransportEvent } from '../src/features/classroom/classroom-session-sync';
import { deriveClassroomLobbyState } from '../src/features/classroom/classroom-lobby-state';
import type { ClassroomSession } from '../src/features/classroom/types';

function buildSession(): ClassroomSession {
  return {
    difficulty: 'medium',
    hostAddress: '192.168.0.42',
    hostPort: 36735,
    id: 'classroom:CLASS1:host',
    participants: [
      {
        avatarId: 'fox',
        id: 'teacher-fox',
        isHost: true,
        isLocalPlayer: true,
        name: 'TeacherFox',
        ready: true,
      },
      {
        avatarId: 'bee',
        id: 'stone-bee',
        isHost: false,
        isLocalPlayer: false,
        name: 'StoneBee',
        ready: false,
      },
    ],
    role: 'host',
    roomCode: 'CLASS1',
    status: 'lobby',
  };
}

test('classroom lobby waits for every participant to be ready before the host can start', () => {
  const pendingState = deriveClassroomLobbyState(buildSession());

  assert.equal(pendingState.readyCount, 1);
  assert.equal(pendingState.canStart, false);

  const readyState = deriveClassroomLobbyState({
    ...buildSession(),
    participants: buildSession().participants.map((participant) => ({
      ...participant,
      ready: true,
    })),
  });

  assert.equal(readyState.readyCount, 2);
  assert.equal(readyState.canStart, true);
});

test('classroom sync applies participant-ready events to the matching player', () => {
  const result = applyClassroomTransportEvent(buildSession(), {
    participantId: 'stone-bee',
    ready: true,
    roomCode: 'CLASS1',
    type: 'participant-ready',
  });

  assert.equal(result.session.participants.find((participant) => participant.id === 'stone-bee')?.ready, true);
});
