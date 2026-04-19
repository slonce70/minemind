import type { QuizAnswerMap } from '../quiz/types';
import { buildQuizResult } from '../quiz/quiz-service';
import { normalizeMatchRecord } from '../results/normalize-match-record';
import type { ActiveRoomRound, RoomParticipant } from '../rooms/types';
import type { ClassroomRoundRecordEnvelope } from './types';

export type ClassroomRoundSubmissions = Record<string, QuizAnswerMap>;

export function mergeClassroomRoundSubmission(
  current: ClassroomRoundSubmissions,
  submission: {
    answers: QuizAnswerMap;
    participantId: string;
  }
): ClassroomRoundSubmissions {
  return {
    ...current,
    [submission.participantId]: submission.answers,
  };
}

export function hasClassroomRoundSubmissionsForAllParticipants(
  participants: RoomParticipant[],
  submissionsByParticipantId: ClassroomRoundSubmissions
) {
  return participants.every((participant) => submissionsByParticipantId[participant.id]);
}

export function buildClassroomRoundResults(input: {
  participants: RoomParticipant[];
  round: ActiveRoomRound;
  submissionsByParticipantId: ClassroomRoundSubmissions;
}): ClassroomRoundRecordEnvelope[] {
  const summaries = input.participants.map((participant) => ({
    participant,
    summary: buildQuizResult(
      input.round.questions,
      input.submissionsByParticipantId[participant.id] ?? {},
      {
        difficulty: input.round.difficulty,
        mode: 'room',
        roomCode: input.round.roomCode,
      }
    ),
  }));

  const standings = summaries
    .map(({ participant, summary }) => ({
      participantId: participant.id,
      score: summary.score,
      name: participant.name,
    }))
    .sort((left, right) => right.score - left.score);

  return summaries.map(({ participant, summary }) => ({
    participantId: participant.id,
    record: normalizeMatchRecord({
      authority: 'host-device',
      input: {
        ...summary,
        standings: standings.map((entry) => ({
          isPlayer: entry.participantId === participant.id,
          name: entry.name,
          score: entry.score,
        })),
      },
      isDemo: false,
      modeOverride: 'classroom',
      syncStatus: 'local-only',
      transport: 'lan-host',
    }),
  }));
}
