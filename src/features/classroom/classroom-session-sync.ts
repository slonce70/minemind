import type { AppLocale } from '../../lib/locale';
import { getSoloQuestionSet } from '../quiz/quiz-service';
import type { ActiveRoomRound } from '../rooms/types';
import type { ClassroomSession, ClassroomTransportEvent } from './types';

export function buildClassroomRoundManifest(input: {
  difficulty: ClassroomSession['difficulty'];
  locale: AppLocale;
  roomCode: string;
}): ActiveRoomRound {
  const seed = `classroom:${input.roomCode}:${input.difficulty}`;

  return {
    difficulty: input.difficulty,
    mode: 'classroom',
    questions: getSoloQuestionSet(input.locale, 8, input.difficulty, seed),
    roomCode: input.roomCode,
    source: 'classroom',
  };
}

export function applyClassroomTransportEvent(
  session: ClassroomSession,
  event: ClassroomTransportEvent
): {
  round?: ActiveRoomRound;
  session: ClassroomSession;
} {
  if ('roomCode' in event && event.roomCode !== session.roomCode) {
    return { session };
  }

  switch (event.type) {
    case 'participant-joined': {
      if (session.participants.some((participant) => participant.id === event.participant.id)) {
        return { session };
      }

      return {
        session: {
          ...session,
          participants: [...session.participants, event.participant],
        },
      };
    }
    case 'participant-ready':
      return {
        session: {
          ...session,
          participants: session.participants.map((participant) => participant.id === event.participantId
            ? {
                ...participant,
                ready: event.ready,
              }
            : participant),
        },
      };
    case 'round-started':
      return {
        round: event.round,
        session: {
          ...session,
          difficulty: event.round.difficulty ?? session.difficulty,
          status: 'active',
        },
      };
    case 'round-finished':
      return {
        session: {
          ...session,
          status: 'finished',
        },
      };
    default:
      return { session };
  }
}
