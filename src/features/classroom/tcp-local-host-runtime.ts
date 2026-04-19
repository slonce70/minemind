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

function isTransportEvent(value: unknown): value is ClassroomTransportEvent {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'type' in value &&
      typeof (value as { type?: unknown }).type === 'string'
  );
}

export function createTcpLocalHostRuntime(options?: {
  defaultPort?: number;
  tcp?: TcpSocketModuleLike;
}) {
  const tcp = options?.tcp ?? getTcpSocketModule();
  const port = options?.defaultPort ?? classroomDefaultPort;
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
        let nextSocket: TcpSocketLike | undefined;
        let handshakeComplete = false;
        const flushHandshake = () => {
          if (handshakeComplete || !nextSocket) {
            return;
          }

          handshakeComplete = true;
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

        nextSocket = tcpModule.connect(
          {
            host: payload.hostAddress,
            port: payload.port ?? port,
          },
          flushHandshake
        );

        clientSocket = nextSocket;
        nextSocket.on('error', reject);
        flushHandshake();
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
