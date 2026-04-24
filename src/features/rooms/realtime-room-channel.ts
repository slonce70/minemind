type RoomRealtimeSnapshot = {
  current_round_id: string | null;
  room_code: string;
  status: string;
};

export type RoomRealtimeEvent =
  | { type: 'room-updated'; roomCode: string }
  | { type: 'round-started'; roomCode: string; roundId: string }
  | { type: 'round-finalizing'; roomCode: string; roundId?: string }
  | { type: 'room-finished'; roomCode: string; roundId?: string };

export type RoomRealtimeHandlers = {
  onRoomFinished?: (event: Extract<RoomRealtimeEvent, { type: 'room-finished' }>) => void;
  onRoomUpdated?: (event: Extract<RoomRealtimeEvent, { type: 'room-updated' }>) => void;
  onRoundFinalizing?: (event: Extract<RoomRealtimeEvent, { type: 'round-finalizing' }>) => void;
  onRoundStarted?: (event: Extract<RoomRealtimeEvent, { type: 'round-started' }>) => void;
};

function deriveRoomRealtimeEvent(
  previous: RoomRealtimeSnapshot | undefined,
  current: RoomRealtimeSnapshot
): RoomRealtimeEvent {
  if (current.status === 'finalizing') {
    return {
      roomCode: current.room_code,
      roundId: current.current_round_id ?? undefined,
      type: 'round-finalizing',
    };
  }

  if (
    current.current_round_id &&
    current.current_round_id !== previous?.current_round_id
  ) {
    return {
      roomCode: current.room_code,
      roundId: current.current_round_id,
      type: 'round-started',
    };
  }

  if (current.status === 'waiting' || current.status === 'finished') {
    return {
      roomCode: current.room_code,
      roundId: current.current_round_id ?? previous?.current_round_id ?? undefined,
      type: 'room-finished',
    };
  }

  return {
    roomCode: current.room_code,
    type: 'room-updated',
  };
}

export function collectRoomRealtimeEvents(snapshots: RoomRealtimeSnapshot[]) {
  const events: RoomRealtimeEvent['type'][] = [];
  let previous: RoomRealtimeSnapshot | undefined;

  for (const snapshot of snapshots) {
    events.push(deriveRoomRealtimeEvent(previous, snapshot).type);
    previous = snapshot;
  }

  return events;
}

function dispatchRoomRealtimeEvent(event: RoomRealtimeEvent, handlers: RoomRealtimeHandlers) {
  switch (event.type) {
    case 'round-started':
      handlers.onRoundStarted?.(event);
      return;
    case 'round-finalizing':
      handlers.onRoundFinalizing?.(event);
      return;
    case 'room-finished':
      handlers.onRoomFinished?.(event);
      return;
    case 'room-updated':
    default:
      handlers.onRoomUpdated?.(event);
  }
}

export function subscribeToRoomChannel(roomCode: string, handlers: RoomRealtimeHandlers) {
  const { isSupabaseConfigured, requireSupabase } = require('../../lib/supabase') as typeof import('../../lib/supabase');

  if (!isSupabaseConfigured) {
    return () => undefined;
  }

  const client = requireSupabase();
  const normalizedCode = roomCode.trim().toUpperCase();
  let previous: RoomRealtimeSnapshot | undefined;
  const channel = client
    .channel(`room:${normalizedCode}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        filter: `room_code=eq.${normalizedCode}`,
        schema: 'public',
        table: 'rooms',
      },
      (payload) => {
        const current = payload.new as RoomRealtimeSnapshot;
        const event = deriveRoomRealtimeEvent(previous, current);
        previous = current;
        dispatchRoomRealtimeEvent(event, handlers);
      }
    )
    .subscribe();

  return () => {
    void client.removeChannel(channel);
  };
}
