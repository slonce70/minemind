import {
  answerGraceMs,
  computeTimelineEndsAt,
  countClosedQuestions,
  countReleasedQuestions,
  difficultyRules,
  type GameDifficulty,
  isGameDifficulty,
  questionWindow,
  scoreAnswer,
  seededPermutation,
} from './game-rules.ts';

export { computeTimelineEndsAt, countClosedQuestions, countReleasedQuestions };

// Clocks of phones and server differ a little: accept answers slightly before the official open.
const earlyAnswerToleranceMs = 1_000;

export function resolveDifficulty(value: unknown): GameDifficulty {
  return isGameDifficulty(value) ? value : 'medium';
}

export function isRoundExpired(endsAt: string | null | undefined, now: Date) {
  return Boolean(endsAt) && now.getTime() >= new Date(endsAt as string).getTime();
}

/**
 * Time left for question `index` on the round timeline, measured by the server clock.
 * 'not-open' before the question opens; null when the answer came after it closed (plus grace).
 */
export function computeTimelineTimeLeftMs(input: {
  difficulty: GameDifficulty;
  index: number;
  now: Date;
  startedAt: Date;
}): number | null | 'not-open' {
  const { closesAt, opensAt } = questionWindow(input);
  const now = input.now.getTime();

  if (now < opensAt.getTime() - earlyAnswerToleranceMs) {
    return 'not-open';
  }

  if (now > closesAt.getTime() + answerGraceMs) {
    return null;
  }

  const timerMs = difficultyRules[input.difficulty].timerSeconds * 1000;

  return Math.max(0, Math.min(timerMs, closesAt.getTime() - now));
}

// Options are shown in a per-round order; the database keeps the original order. Two-option
// (true/false) questions always read "true, false".
function optionOrder(roundId: string, questionId: string, optionCount = 4) {
  return optionCount === 2 ? [0, 1] : seededPermutation(optionCount, `${roundId}:${questionId}`);
}

export function toOriginalOption(displayIndex: number, roundId: string, questionId: string, optionCount = 4) {
  if (!Number.isInteger(displayIndex) || displayIndex < 0 || displayIndex >= optionCount) {
    return -1;
  }

  return optionOrder(roundId, questionId, optionCount)[displayIndex];
}

export function toDisplayOption(originalIndex: number, roundId: string, questionId: string, optionCount = 4) {
  return optionOrder(roundId, questionId, optionCount).indexOf(originalIndex);
}

export function toDisplayOptions<T>(options: T[], roundId: string, questionId: string) {
  return optionOrder(roundId, questionId, options.length).map((originalIndex) => options[originalIndex]);
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
