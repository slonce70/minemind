import {
  answerGraceMs,
  computeRoundEndsAt,
  difficultyRules,
  type GameDifficulty,
  isGameDifficulty,
  scoreAnswer,
  seededPermutation,
} from './game-rules.ts';

export { computeRoundEndsAt };

export function resolveDifficulty(value: unknown): GameDifficulty {
  return isGameDifficulty(value) ? value : 'medium';
}

export function isRoundExpired(endsAt: string | null | undefined, now: Date) {
  return Boolean(endsAt) && now.getTime() >= new Date(endsAt as string).getTime();
}

/**
 * Time left measured by the server from the moment the player opened the question.
 * Returns null when the answer arrived after the timer (plus network grace) ran out.
 * Without an `openedAt` the answer still counts, but earns no speed bonus.
 */
export function computeServerTimeLeftMs(input: {
  difficulty: GameDifficulty;
  now: Date;
  openedAt: string | null | undefined;
}) {
  if (!input.openedAt) {
    return 0;
  }

  const timerMs = difficultyRules[input.difficulty].timerSeconds * 1000;
  const elapsedMs = input.now.getTime() - new Date(input.openedAt).getTime();

  if (elapsedMs > timerMs + answerGraceMs) {
    return null;
  }

  return Math.max(0, Math.min(timerMs, timerMs - elapsedMs));
}

// Options are shown in a per-round order; the database keeps the original order.
function optionOrder(roundId: string, questionId: string) {
  return seededPermutation(4, `${roundId}:${questionId}`);
}

export function toOriginalOption(displayIndex: number, roundId: string, questionId: string) {
  if (!Number.isInteger(displayIndex) || displayIndex < 0 || displayIndex > 3) {
    return -1;
  }

  return optionOrder(roundId, questionId)[displayIndex];
}

export function toDisplayOption(originalIndex: number, roundId: string, questionId: string) {
  return optionOrder(roundId, questionId).indexOf(originalIndex);
}

export function toDisplayOptions(options: string[], roundId: string, questionId: string) {
  return optionOrder(roundId, questionId).map((originalIndex) => options[originalIndex]);
}

/** Picks `count` ids in a seeded random order (no repeats). */
export function pickSeededIds(ids: string[], count: number, seed: string) {
  return seededPermutation(ids.length, seed)
    .slice(0, count)
    .map((index) => ids[index]);
}

export type ScoredSubmission = {
  player_id: string;
  question_id: string;
  selected_option: number | null;
  time_left_ms: number | null;
};

/** Ranks every participant; unanswered questions (and players who never answered) score 0. */
export function buildRoundRanking(input: {
  correctOptionByQuestionId: Map<string, number>;
  difficulty: GameDifficulty;
  participantIds: string[];
  questionIds: string[];
  roundId: string;
  submissions: ScoredSubmission[];
}) {
  return input.participantIds
    .map((playerId) => {
      let bestStreak = 0;
      let correctCount = 0;
      let currentStreak = 0;
      let score = 0;

      // Walk questions in round order so streaks match what the player saw.
      for (const questionId of input.questionIds) {
        const submission = input.submissions.find(
          (entry) => entry.player_id === playerId && entry.question_id === questionId
        );
        const isCorrect =
          submission?.selected_option !== null &&
          submission?.selected_option !== undefined &&
          input.correctOptionByQuestionId.get(questionId) === submission.selected_option;

        if (isCorrect) {
          correctCount += 1;
          currentStreak += 1;
          bestStreak = Math.max(bestStreak, currentStreak);
          score += scoreAnswer({
            difficulty: input.difficulty,
            isCorrect,
            timeLeftMs: submission?.time_left_ms ?? 0,
          });
        } else {
          currentStreak = 0;
        }
      }

      return {
        best_streak: bestStreak,
        correct_count: correctCount,
        player_id: playerId,
        round_id: input.roundId,
        score,
      };
    })
    .sort((left, right) => right.score - left.score)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export function countAnsweredSubmissions(submissions: ScoredSubmission[]) {
  return submissions.filter((submission) => submission.selected_option !== null).length;
}
