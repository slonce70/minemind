/** Readiness of a room; in big-screen rooms the host's device only shows the round and is left out. */
export function deriveRoomLobbyState<
  TRoom extends {
    participants: Array<{ isHost?: boolean; ready: boolean }>;
    roomCode: string;
    settings?: { screenMode?: boolean };
    status: 'active' | 'lobby' | 'waiting' | 'finalizing' | 'finished';
  },
>(room: TRoom) {
  const players = room.settings?.screenMode ? room.participants.filter((participant) => !participant.isHost) : room.participants;
  const readyCount = players.filter((participant) => participant.ready).length;
  const minimumPlayers = room.settings?.screenMode ? 1 : 2;

  return {
    canStart: room.status === 'active' || (readyCount === players.length && players.length >= minimumPlayers),
    participantCount: players.length,
    readyCount,
    roomCode: room.roomCode,
  };
}
