import type { ClassroomRoundSummary } from './types';
import type { RoomParticipant } from '../rooms/types';
import { normalizeMatchRecord } from '../results/normalize-match-record';

export function finalizeClassroomRound(
  summary: ClassroomRoundSummary,
  participants: RoomParticipant[]
) {
  return normalizeMatchRecord({
    authority: 'host-device',
    input: {
      ...summary,
      standings: participants.map((participant) => ({
        isPlayer: participant.isLocalPlayer,
        name: participant.name,
        score: summary.standings.find((entry) => entry.name === participant.name)?.score ?? 0,
      })),
    },
    isDemo: false,
    modeOverride: 'classroom',
    syncStatus: 'local-only',
    transport: 'lan-host',
  });
}
