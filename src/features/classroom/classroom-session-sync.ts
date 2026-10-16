import { computeRoundEndsAt } from '../../../supabase/functions/_shared/game-rules';
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
  const questions = getSoloQuestionSet(input.locale, 8, input.difficulty, seed);

  return {
    difficulty: input.difficulty,
    endsAt: computeRoundEndsAt({
      difficulty: input.difficulty,
      questionCount: questions.length,
      startedAt: new Date(),
    }).toISOString(),
    mode: 'classroom',
    questions,
    roomCode: input.roomCode,
    source: 'classroom',
  };
}

/** What guests receive: no correct answers or explanations until they answer. */
export function toGuestClassroomRound(round: ActiveRoomRound): ActiveRoomRound {
  return {
    ...round,
    questions: round.questions.map(({ correctIndex: _correctIndex, explanation: _explanation, ...question }) => question),
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
      if (session.role === 'host') {
        // The host keeps its own full manifest; the broadcast copy has no answers.
        return { session };
      }

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
