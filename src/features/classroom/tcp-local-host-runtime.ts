import { classroomDefaultPort, type ClassroomTransportEvent, type HostSessionConfig, type JoinPayload } from './types';
import { getTcpSocketModule } from './tcp-socket-module';

type TcpSocketLike = {
  destroy: () => void;
  on: (event: string, listener: (value?: unknown) => void) => unknown;
  write: (payload: string) => unknown;
};

type TcpServerLike = {
  close: (callback?: () => void) => void;
  listen: (options: { host?: string; port: number }, callback?: () => void) => void;
  on: (event: string, listener: (value?: unknown) => void) => unknown;
};

type TcpSocketModuleLike = {
  connect: (options: { host: string; port: number }, callback?: () => void) => TcpSocketLike;
  createServer: (listener: (socket: TcpSocketLike) => void) => TcpServerLike;
};

function normalizeChunk(chunk: unknown) {
  if (typeof chunk === 'string') {
    return chunk;
  }

  if (chunk && typeof chunk === 'object' && 'toString' in chunk && typeof chunk.toString === 'function') {
    return chunk.toString();
  }

  return '';
}

function encodeEvent(event: ClassroomTransportEvent) {
  return `${JSON.stringify(event)}\n`;
}

const KNOWN_EVENT_TYPES: ReadonlySet<ClassroomTransportEvent['type']> = new Set([
  'participant-joined',
  'participant-ready',
  'round-submitted',
  'round-started',
  'round-finished',
]);

// Data arriving over the LAN is untrusted: any device on the network can open
// the socket and send arbitrary JSON. Validate the envelope (known event type +
// string room code) before it is applied to session state so a malformed or
// hostile frame cannot poison or crash the lobby.
function isTransportEvent(value: unknown): value is ClassroomTransportEvent {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as { type?: unknown; roomCode?: unknown };

  return (
    typeof candidate.type === 'string' &&
    KNOWN_EVENT_TYPES.has(candidate.type as ClassroomTransportEvent['type']) &&
    typeof candidate.roomCode === 'string'
  );
}

const CONNECT_TIMEOUT_MS = 8000;

export function createTcpLocalHostRuntime(options?: {
  connectTimeoutMs?: number;
  defaultPort?: number;
  tcp?: TcpSocketModuleLike;
}) {
  const tcp = options?.tcp ?? getTcpSocketModule();
  const port = options?.defaultPort ?? classroomDefaultPort;
  const connectTimeoutMs = options?.connectTimeoutMs ?? CONNECT_TIMEOUT_MS;
  const listeners = new Set<(event: ClassroomTransportEvent) => void>();
  const peerSockets = new Set<TcpSocketLike>();
  const socketBuffers = new Map<TcpSocketLike, string>();
  let server: TcpServerLike | undefined;
  let clientSocket: TcpSocketLike | undefined;

  const emit = (event: ClassroomTransportEvent) => {
    for (const listener of listeners) {
      listener(event);
    }
  };

  const attachSocket = (socket: TcpSocketLike) => {
    peerSockets.add(socket);
    socketBuffers.set(socket, '');

    socket.on('data', (chunk) => {
      const previous = socketBuffers.get(socket) ?? '';
      const combined = `${previous}${normalizeChunk(chunk)}`;
      const frames = combined.split('\n');
      const trailing = frames.pop() ?? '';

      socketBuffers.set(socket, trailing);

      for (const frame of frames) {
        if (!frame.trim()) {
          continue;
        }

        try {
          const parsed = JSON.parse(frame) as unknown;

          if (isTransportEvent(parsed)) {
            emit(parsed);

            // Host acts as a hub: relay each peer's event to every other peer
            // so participants learn about one another. Without this the
            // topology is a pure star and each participant only ever sees
            // itself in the roster. Only the host (which owns `server`) relays;
            // clients never rebroadcast.
            if (server) {
              const relayed = `${frame}\n`;
              for (const peer of peerSockets) {
                if (peer !== socket) {
                  peer.write(relayed);
                }
              }
            }
          }
        } catch {
          // Ignore malformed frames from peers and keep the socket alive.
        }
      }
    });

    socket.on('close', () => {
      peerSockets.delete(socket);
      socketBuffers.delete(socket);
    });
  };

  const ensureTcp = () => {
    if (!tcp) {
      throw new Error('CLASSROOM_NATIVE_TRANSPORT_UNAVAILABLE');
    }

    return tcp;
  };

  return {
    advertise: async (config: HostSessionConfig) => {
      const tcpModule = ensureTcp();

      await new Promise<void>((resolve, reject) => {
        server?.close();
        server = tcpModule.createServer((socket) => {
          attachSocket(socket);
        });
        server.on('error', reject);
        server.listen({ host: config.hostAddress, port: config.port ?? port }, resolve);
      });
    },
    close: async () => {
      clientSocket?.destroy();
      clientSocket = undefined;

      for (const socket of peerSockets) {
        socket.destroy();
      }
      peerSockets.clear();
      socketBuffers.clear();

      if (!server) {
        return;
      }

      await new Promise<void>((resolve) => {
        server?.close(() => {
          resolve();
        });
      });
      server = undefined;
    },
    connect: async (payload: JoinPayload) => {
      const tcpModule = ensureTcp();

      await new Promise<void>((resolve, reject) => {
        clientSocket?.destroy();
        let settled = false;
        const timeout = setTimeout(() => {
          if (settled) {
            return;
          }

          settled = true;
          nextSocket?.destroy();
          clientSocket = undefined;
          reject(new Error('CLASSROOM_CONNECT_TIMEOUT'));
        }, connectTimeoutMs);

        // Only complete the handshake once the socket is actually connected.
        // Previously this ran synchronously right after connect(), so joining a
        // classroom "succeeded" even when the host was unreachable and the
        // promise resolved before any connection existed.
        const flushHandshake = () => {
          if (settled || !nextSocket) {
            return;
          }

          settled = true;
          clearTimeout(timeout);
          attachSocket(nextSocket);
          nextSocket.write(
            encodeEvent({
              participant: payload.guestProfile,
              roomCode: payload.roomCode,
              type: 'participant-joined',
            })
          );
          resolve();
        };

        const nextSocket: TcpSocketLike = tcpModule.connect(
          {
            host: payload.hostAddress,
            port: payload.port ?? port,
          },
          flushHandshake
        );

        clientSocket = nextSocket;
        nextSocket.on('error', (error) => {
          if (settled) {
            return;
          }

          settled = true;
          clearTimeout(timeout);
          clientSocket = undefined;
          reject(error instanceof Error ? error : new Error('CLASSROOM_CONNECT_FAILED'));
        });
      });
    },
    publish: async (event: ClassroomTransportEvent) => {
      emit(event);

      const payload = encodeEvent(event);

      if (peerSockets.size > 0) {
        for (const socket of peerSockets) {
          socket.write(payload);
        }
        return;
      }

      clientSocket?.write(payload);
    },
    subscribe: (listener: (event: ClassroomTransportEvent) => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
