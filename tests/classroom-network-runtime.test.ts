import assert from 'node:assert/strict';
import test from 'node:test';

import { createTcpLocalHostRuntime } from '../src/features/classroom/tcp-local-host-runtime';
import {
  applyClassroomTransportEvent,
  buildClassroomRoundManifest,
} from '../src/features/classroom/classroom-session-sync';
import type { ClassroomSession, ClassroomTransportEvent } from '../src/features/classroom/types';

type SocketHandler = (value?: unknown) => void;

function createFakeSocket() {
  const handlers = new Map<string, SocketHandler[]>();

  const socket = {
    destroy() {
      emit('close');
    },
    on(event: string, handler: SocketHandler) {
      handlers.set(event, [...(handlers.get(event) ?? []), handler]);
      return socket;
    },
    peer: undefined as undefined | ReturnType<typeof createFakeSocket>,
    writes: [] as string[],
    write(value: string) {
      socket.writes.push(value);
      socket.peer?.emit('data', value);
      return true;
    },
    emit,
  };

  function emit(event: string, value?: unknown) {
    for (const handler of handlers.get(event) ?? []) {
      handler(value);
    }
  }

  return socket;
}

test('tcp classroom runtime frames join and round-start events over a host session', async () => {
  const acceptedSockets: Array<ReturnType<typeof createFakeSocket>> = [];
  let connectionListener:
    | ((socket: ReturnType<typeof createFakeSocket>) => void)
    | undefined;

  const runtime = createTcpLocalHostRuntime({
    defaultPort: 36735,
    tcp: {
      connect: (_options, callback) => {
        const clientSocket = createFakeSocket();
        const hostSocket = createFakeSocket();
        clientSocket.peer = hostSocket;
        hostSocket.peer = clientSocket;
        acceptedSockets.push(hostSocket);
        connectionListener?.(hostSocket);
        callback?.();
        return clientSocket;
      },
      createServer: (listener) => {
        connectionListener = listener;
        return {
          close: (callback?: () => void) => callback?.(),
          listen: (_options, callback?: () => void) => callback?.(),
          on: () => undefined,
        };
      },
    },
  });

  const events: ClassroomTransportEvent[] = [];
  runtime.subscribe((event) => {
    events.push(event);
  });

  await runtime.advertise({
    difficulty: 'medium',
    hostAddress: '192.168.31.207',
    hostProfile: {
      avatarId: 'fox',
      id: 'teacher-fox',
      isHost: true,
      isLocalPlayer: true,
      name: 'TeacherFox',
      ready: true,
    },
    roomCode: 'CLASS1',
  });

  await runtime.connect({
    guestProfile: {
      avatarId: 'bee',
      id: 'stone-bee',
      isHost: false,
      isLocalPlayer: false,
      name: 'StoneBee',
      ready: true,
    },
    hostAddress: '192.168.31.207',
    roomCode: 'CLASS1',
  });

  assert.equal(events.length, 1);
  assert.equal(events[0]?.type, 'participant-joined');
  assert.equal(events[0]?.roomCode, 'CLASS1');

  const round = buildClassroomRoundManifest({
    difficulty: 'medium',
    locale: 'uk',
    roomCode: 'CLASS1',
  });

  await runtime.publish({
    round,
    roomCode: 'CLASS1',
    type: 'round-started',
  });

  assert.equal(acceptedSockets.length, 1);
  assert.match(acceptedSockets[0].writes[0] ?? '', /"type":"round-started"/);
  assert.match(acceptedSockets[0].writes[0] ?? '', /"roomCode":"CLASS1"/);
});

test('classroom sync builds a shared round and applies transport events to the lobby state', () => {
  const session: ClassroomSession = {
    difficulty: 'hard',
    hostAddress: '192.168.31.207',
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
    ],
    role: 'host',
    roomCode: 'CLASS1',
    status: 'lobby',
  };

  const round = buildClassroomRoundManifest({
    difficulty: 'hard',
    locale: 'uk',
    roomCode: 'CLASS1',
  });

  assert.equal(round.mode, 'classroom');
  assert.equal(round.source, 'classroom');
  assert.equal(round.questions.length, 8);

  const joined = applyClassroomTransportEvent(session, {
    participant: {
      avatarId: 'bee',
      id: 'stone-bee',
      isHost: false,
      isLocalPlayer: false,
      name: 'StoneBee',
      ready: true,
    },
    roomCode: 'CLASS1',
    type: 'participant-joined',
  });

  assert.equal(joined.session.participants.length, 2);

  const started = applyClassroomTransportEvent(joined.session, {
    round,
    roomCode: 'CLASS1',
    type: 'round-started',
  });

  assert.equal(started.session.status, 'active');
  assert.deepEqual(started.round, round);
});
