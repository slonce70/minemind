export type ParsedClassroomInvite = {
  hostAddress: string;
  port?: number;
  roomCode?: string;
};

export function buildClassroomInviteToken(input: {
  hostAddress: string;
  port?: number;
  roomCode: string;
}) {
  const params = [
    `host=${encodeURIComponent(input.hostAddress)}`,
    ...(typeof input.port === 'number' ? [`port=${input.port}`] : []),
    `roomCode=${encodeURIComponent(input.roomCode)}`,
  ];

  return `minemind://classroom?${params.join('&')}`;
}

export function parseClassroomInviteInput(input: string): ParsedClassroomInvite | null {
  const trimmed = input.trim();

  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith('minemind://')) {
    const url = new URL(trimmed);
    const hostAddress = url.searchParams.get('host')?.trim();
    const roomCode = url.searchParams.get('roomCode')?.trim().toUpperCase();
    const portValue = url.searchParams.get('port')?.trim();
    const port = portValue ? Number(portValue) : undefined;

    if (!hostAddress || Number.isNaN(port)) {
      return null;
    }

    return {
      hostAddress,
      port,
      roomCode: roomCode || undefined,
    };
  }

  const endpointMatch = trimmed.match(/^([^:\s]+)(?::(\d+))?$/);

  if (!endpointMatch) {
    return null;
  }

  const [, hostAddress, portValue] = endpointMatch;
  const port = portValue ? Number(portValue) : undefined;

  if (!hostAddress || Number.isNaN(port)) {
    return null;
  }

  return {
    hostAddress,
    port,
    roomCode: undefined,
  };
}
