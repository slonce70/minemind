type RoomRealtimeSnapshot = {
  current_round_id: string | null;
  room_code: string;
  status: string;
};

export type RoomRealtimeEvent =
  | { type: 'room-updated'; roomCode: string }
  | { type: 'round-started'; roomCode: string; roundId: string }
  | { type: 'round-finalizing'; roomCode: string; roundId?: string }
  | { type: 'room-finished'; roomCode: string; roundId?: string }
  /** Everyone answered and the server closed the question early: re-read the timeline. */
  | { type: 'timeline-moved'; roomCode: string };

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

export type AnswerProgressEvent = { playerId: string; questionId: string };

export type RoomChannelListener = {
  onAnswerProgress?: (event: AnswerProgressEvent) => void;
  onPresence?: (onlinePlayerIds: string[]) => void;
  onRoomEvent?: (event: RoomRealtimeEvent) => void;
  /** true while the realtime channel is joined; polling can slow down meanwhile. */
  onStatus?: (isLive: boolean) => void;
};

type SharedRoomChannel = {
  isLive: boolean;
  listeners: Set<RoomChannelListener>;
  onlinePlayerIds: string[];
  unsubscribe: () => void;
};

// One realtime channel per room for the whole app: the lobby and the round screen are mounted
// at the same time, and joining the same topic twice would kick the first subscription.
const sharedChannels = new Map<string, SharedRoomChannel>();

function openRoomChannel(
  room: { id: string; roomCode: string },
  presence: { nickname: string; playerId: string },
  shared: SharedRoomChannel
) {
  const { requireSupabase } = require('../../lib/supabase') as typeof import('../../lib/supabase');
  const client = requireSupabase();
  let previous: RoomRealtimeSnapshot | undefined;
  const channel = client.channel(`room:${room.id}`, {
    config: { presence: { key: presence.playerId }, private: true },
  });

  channel
    .on(
      'postgres_changes',
      { event: 'UPDATE', filter: `id=eq.${room.id}`, schema: 'public', table: 'rooms' },
      (payload) => {
        const current = payload.new as RoomRealtimeSnapshot;
        const event = deriveRoomRealtimeEvent(previous, current);
        previous = current;
        shared.listeners.forEach((listener) => listener.onRoomEvent?.(event));
      }
    )
    .on('broadcast', { event: 'answer-progress' }, ({ payload }) => {
      shared.listeners.forEach((listener) => listener.onAnswerProgress?.(payload as AnswerProgressEvent));
    })
    .on('broadcast', { event: 'timeline-moved' }, () => {
      shared.listeners.forEach((listener) => listener.onRoomEvent?.({ roomCode: room.roomCode, type: 'timeline-moved' }));
    })
    .on('presence', { event: 'sync' }, () => {
      shared.onlinePlayerIds = Object.keys(channel.presenceState());
      shared.listeners.forEach((listener) => listener.onPresence?.(shared.onlinePlayerIds));
    })
    .subscribe((status) => {
      shared.isLive = status === 'SUBSCRIBED';
      shared.listeners.forEach((listener) => listener.onStatus?.(shared.isLive));

      if (status === 'SUBSCRIBED') {
        void channel.track({ nickname: presence.nickname, playerId: presence.playerId });
      }
    });

  return () => {
    void client.removeChannel(channel);
  };
}

/**
 * Room updates (joins, ready toggles, round start/finish), who is online and who answered.
 * The database stays the source of truth: listeners re-read state through Edge Functions.
 */
export function subscribeToRoomChannel(
  room: { id: string; roomCode: string },
  presence: { nickname: string; playerId: string },
  listener: RoomChannelListener
) {
  const { isSupabaseConfigured } = require('../../lib/supabase') as typeof import('../../lib/supabase');

  if (!isSupabaseConfigured) {
    return () => undefined;
  }

  let shared = sharedChannels.get(room.id);

  if (!shared) {
    const created: SharedRoomChannel = {
      isLive: false,
      listeners: new Set(),
      onlinePlayerIds: [],
      unsubscribe: () => undefined,
    };
    created.unsubscribe = openRoomChannel(room, presence, created);
    sharedChannels.set(room.id, created);
    shared = created;
  }

  const current = shared;
  current.listeners.add(listener);
  listener.onStatus?.(current.isLive);
  listener.onPresence?.(current.onlinePlayerIds);

  return () => {
    current.listeners.delete(listener);

    if (current.listeners.size === 0) {
      current.unsubscribe();
      sharedChannels.delete(room.id);
    }
  };
}
