export function deriveRoomLobbyState(room: {
  participants: Array<{ ready: boolean }>;
  roomCode: string;
  status: 'active' | 'lobby';
}) {
  const readyCount = room.participants.filter((participant) => participant.ready).length;

  return {
    canStart: room.status === 'active' || (readyCount === room.participants.length && room.participants.length > 1),
    participantCount: room.participants.length,
    readyCount,
    roomCode: room.roomCode,
  };
}
