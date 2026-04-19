import type {
  ClassroomTransportEvent,
  ClientSessionHandle,
  HostSessionConfig,
  HostSessionHandle,
  JoinPayload,
} from './types';
import { classroomDefaultPort } from './types';
import { createTcpLocalHostRuntime } from './tcp-local-host-runtime';

type LocalHostRuntime = {
  advertise: (config: HostSessionConfig) => Promise<void>;
  close: () => Promise<void>;
  connect: (payload: JoinPayload) => Promise<void>;
  publish: (event: ClassroomTransportEvent) => Promise<void>;
  subscribe: (listener: (event: ClassroomTransportEvent) => void) => () => void;
};

export type LocalHostTransport = {
  close: () => Promise<void>;
  joinHostSession: (payload: JoinPayload) => Promise<ClientSessionHandle>;
  publishEvent: (event: ClassroomTransportEvent) => Promise<void>;
  subscribe: (listener: (event: ClassroomTransportEvent) => void) => () => void;
  startHostSession: (config: HostSessionConfig) => Promise<HostSessionHandle>;
};

export function createLocalHostTransport(runtime: LocalHostRuntime): LocalHostTransport {
  return {
    close: () => runtime.close(),
    joinHostSession: async (payload) => {
      await runtime.connect(payload);

      return {
        hostAddress: payload.hostAddress,
        port: payload.port ?? classroomDefaultPort,
        roomCode: payload.roomCode,
        sessionId: `classroom:${payload.roomCode}:client`,
      };
    },
    publishEvent: (event) => runtime.publish(event),
    subscribe: (listener) => runtime.subscribe(listener),
    startHostSession: async (config) => {
      await runtime.advertise(config);

      return {
        hostAddress: config.hostAddress,
        port: config.port ?? classroomDefaultPort,
        roomCode: config.roomCode,
        sessionId: `classroom:${config.roomCode}:host`,
      };
    },
  };
}

export function createDefaultLocalHostTransport() {
  return createLocalHostTransport(createTcpLocalHostRuntime());
}

let sharedLocalHostTransport: LocalHostTransport | undefined;

export function getSharedLocalHostTransport() {
  sharedLocalHostTransport ??= createDefaultLocalHostTransport();
  return sharedLocalHostTransport;
}
