import { difficultyRules } from '../../../supabase/functions/_shared/game-rules';
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

/**
 * Host-side record of one guest answer. First answer per question wins; unknown questions are
 * ignored. Returns the reveal to send back to that guest, or null when nothing was recorded.
 */
export function recordClassroomAnswer(
  current: QuizAnswerMap,
  round: ActiveRoomRound,
  answer: { questionId: string; selectedIndex: number; timeLeft: number }
) {
  const question = round.questions.find((entry) => entry.id === answer.questionId);

  if (!question || typeof question.correctIndex !== 'number' || current[answer.questionId]) {
    return null;
  }

  const timerSeconds = difficultyRules[round.difficulty ?? 'medium'].timerSeconds;
  const selectedIndex = Number.isInteger(answer.selectedIndex) && answer.selectedIndex >= 0 && answer.selectedIndex < question.options.length
    ? answer.selectedIndex
    : -1;

  return {
    answers: {
      ...current,
      [answer.questionId]: {
        selectedIndex,
        timeLeft: Math.max(0, Math.min(timerSeconds, Math.floor(answer.timeLeft) || 0)),
      },
    },
    reveal: {
      correctIndex: question.correctIndex,
      explanation: question.explanation,
      isCorrect: selectedIndex === question.correctIndex,
    },
  };
}

// Only what the player chose and when: correctness is always recomputed from the host manifest.
function stripClientVerdicts(answers: QuizAnswerMap): QuizAnswerMap {
  return Object.fromEntries(
    Object.entries(answers).map(([questionId, answer]) => [
      questionId,
      { selectedIndex: answer.selectedIndex, timeLeft: answer.timeLeft },
    ])
  );
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
      stripClientVerdicts(input.submissionsByParticipantId[participant.id] ?? {}),
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
