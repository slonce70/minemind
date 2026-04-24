export function deriveClassroomLobbyState(session: {
  participants: Array<{ ready: boolean }>;
  status: 'active' | 'lobby' | 'finished';
}) {
  const readyCount = session.participants.filter((participant) => participant.ready).length;

  return {
    canStart:
      session.status === 'active' ||
      (readyCount === session.participants.length && session.participants.length > 0),
    participantCount: session.participants.length,
    readyCount,
  };
}
