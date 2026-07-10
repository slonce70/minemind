import assert from 'node:assert/strict';
import test from 'node:test';

import { createTcpLocalHostRuntime } from '../src/features/classroom/tcp-local-host-runtime';
import {
  applyClassroomTransportEvent,
  buildClassroomRoundManifest,
} from '../src/features/classroom/classroom-session-sync';
import type { ClassroomSession, ClassroomTransportEvent } from '../src/features/classroom/types';
import type { RoomParticipant } from '../src/features/rooms/types';

type SocketHandler = (value?: unknown) => void;

type FakeSocket = {
  destroy: () => void;
  on: (event: string, handler: SocketHandler) => FakeSocket;
  peer: FakeSocket | undefined;
  writes: string[];
  write: (value: string) => boolean;
  emit: (event: string, value?: unknown) => void;
};

function createFakeSocket(): FakeSocket {
  const handlers = new Map<string, SocketHandler[]>();

  const socket: FakeSocket = {
    destroy() {
      emit('close');
    },
    on(event: string, handler: SocketHandler) {
      handlers.set(event, [...(handlers.get(event) ?? []), handler]);
      return socket;
    },
    peer: undefined,
    writes: [],
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

function createLinkedPair() {
  const clientSide = createFakeSocket();
  const hostSide = createFakeSocket();
  clientSide.peer = hostSide;
  hostSide.peer = clientSide;
  return { clientSide, hostSide };
}

/**
 * A shared fake TCP fabric: one host advertises and accepts connections; each
 * client connects with its own runtime, modeling reality where host and clients
 * are separate processes (not a single runtime playing both roles).
 */
function createFabric() {
  let hostConnectionListener: ((socket: ReturnType<typeof createFakeSocket>) => void) | undefined;

  return {
    hostTcp: {
      connect: () => {
        throw new Error('host does not connect out');
      },
      createServer: (listener: (socket: ReturnType<typeof createFakeSocket>) => void) => {
        hostConnectionListener = listener;
        return {
          close: (callback?: () => void) => callback?.(),
          listen: (_options: unknown, callback?: () => void) => callback?.(),
          on: () => undefined,
        };
      },
    },
    clientTcp: {
      connect: (_options: unknown, callback?: () => void) => {
        const { clientSide, hostSide } = createLinkedPair();
        hostConnectionListener?.(hostSide);
        // Real sockets return synchronously and fire the connect callback on a
        // later tick, after the caller has captured the socket reference.
        queueMicrotask(() => callback?.());
        return clientSide;
      },
      createServer: () => {
        throw new Error('client does not advertise');
      },
    },
  };
}

const hostProfile: RoomParticipant = {
  avatarId: 'fox',
  id: 'teacher-fox',
  isHost: true,
  isLocalPlayer: true,
  name: 'TeacherFox',
  ready: true,
};

const beeProfile: RoomParticipant = {
  avatarId: 'bee',
  id: 'stone-bee',
  isHost: false,
  isLocalPlayer: false,
  name: 'StoneBee',
  ready: true,
};

const wolfProfile: RoomParticipant = {
  avatarId: 'wolf',
  id: 'clay-wolf',
  isHost: false,
  isLocalPlayer: false,
  name: 'ClayWolf',
  ready: true,
};

test('host relays participant joins so every participant sees the others', async () => {
  const fabric = createFabric();
  const host = createTcpLocalHostRuntime({ defaultPort: 36735, tcp: fabric.hostTcp });
  const clientA = createTcpLocalHostRuntime({ defaultPort: 36735, tcp: fabric.clientTcp });
  const clientB = createTcpLocalHostRuntime({ defaultPort: 36735, tcp: fabric.clientTcp });

  const hostEvents: ClassroomTransportEvent[] = [];
  const clientAEvents: ClassroomTransportEvent[] = [];
  const clientBEvents: ClassroomTransportEvent[] = [];
  host.subscribe((event) => hostEvents.push(event));
  clientA.subscribe((event) => clientAEvents.push(event));
  clientB.subscribe((event) => clientBEvents.push(event));

  await host.advertise({
    difficulty: 'medium',
    hostAddress: '192.168.31.207',
    hostProfile,
    roomCode: 'CLASS1',
  });

  await clientA.connect({
    guestProfile: beeProfile,
    hostAddress: '192.168.31.207',
    roomCode: 'CLASS1',
  });

  await clientB.connect({
    guestProfile: wolfProfile,
    hostAddress: '192.168.31.207',
    roomCode: 'CLASS1',
  });

  // Host saw both joins.
  assert.deepEqual(
    hostEvents.filter((event) => event.type === 'participant-joined').map((event) =>
      event.type === 'participant-joined' ? event.participant.id : null
    ),
    ['stone-bee', 'clay-wolf']
  );

  // Participant A learns about participant B via the host relay.
  assert.ok(
    clientAEvents.some(
      (event) => event.type === 'participant-joined' && event.participant.id === 'clay-wolf'
    ),
    'client A should be told about client B joining'
  );
});

test('host broadcasts round-started to connected participants', async () => {
  const fabric = createFabric();
  const host = createTcpLocalHostRuntime({ defaultPort: 36735, tcp: fabric.hostTcp });
  const clientA = createTcpLocalHostRuntime({ defaultPort: 36735, tcp: fabric.clientTcp });

  const clientAEvents: ClassroomTransportEvent[] = [];
  clientA.subscribe((event) => clientAEvents.push(event));

  await host.advertise({
    difficulty: 'medium',
    hostAddress: '192.168.31.207',
    hostProfile,
    roomCode: 'CLASS1',
  });
  await clientA.connect({
    guestProfile: beeProfile,
    hostAddress: '192.168.31.207',
    roomCode: 'CLASS1',
  });

  const round = buildClassroomRoundManifest({ difficulty: 'medium', locale: 'uk', roomCode: 'CLASS1' });
  await host.publish({ round, roomCode: 'CLASS1', type: 'round-started' });

  assert.ok(
    clientAEvents.some((event) => event.type === 'round-started'),
    'client A should receive the round-started broadcast'
  );
});

test('connect rejects when the host never completes the handshake', async () => {
  const runtime = createTcpLocalHostRuntime({
    connectTimeoutMs: 20,
    defaultPort: 36735,
    tcp: {
      // Never invokes the connection callback: the host is unreachable.
      connect: () => createFakeSocket(),
      createServer: () => {
        throw new Error('unused');
      },
    },
  });

  await assert.rejects(
    () =>
      runtime.connect({
        guestProfile: beeProfile,
        hostAddress: '10.0.0.9',
        roomCode: 'CLASS1',
      }),
    /CLASSROOM_CONNECT_TIMEOUT/
  );
});

test('connect rejects immediately when the socket emits an error', async () => {
  const failingSocket = createFakeSocket();
  const runtime = createTcpLocalHostRuntime({
    defaultPort: 36735,
    tcp: {
      connect: () => {
        // Emit an error on the next tick so the error handler is registered.
        queueMicrotask(() => failingSocket.emit('error', new Error('ECONNREFUSED')));
        return failingSocket;
      },
      createServer: () => {
        throw new Error('unused');
      },
    },
  });

  await assert.rejects(
    () =>
      runtime.connect({
        guestProfile: beeProfile,
        hostAddress: '10.0.0.9',
        roomCode: 'CLASS1',
      }),
    /ECONNREFUSED/
  );
});

test('classroom sync builds a shared round and applies transport events to the lobby state', () => {
  const session: ClassroomSession = {
    difficulty: 'hard',
    hostAddress: '192.168.31.207',
    id: 'classroom:CLASS1:host',
    participants: [hostProfile],
    role: 'host',
    roomCode: 'CLASS1',
    status: 'lobby',
  };

  const round = buildClassroomRoundManifest({ difficulty: 'hard', locale: 'uk', roomCode: 'CLASS1' });

  assert.equal(round.mode, 'classroom');
  assert.equal(round.source, 'classroom');
  assert.equal(round.questions.length, 8);

  const joined = applyClassroomTransportEvent(session, {
    participant: beeProfile,
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
