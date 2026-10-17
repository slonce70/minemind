import { contentDifficulties, type ContentDifficulty } from './types';

export type QuestionStats = {
  answer_ms_total: number;
  attempts: number;
  content_id: string;
  correct: number;
  timed_answers: number;
};

export type DifficultySuggestion = {
  accuracy: number;
  attempts: number;
  averageMs: number | null;
  from: ContentDifficulty;
  id: string;
  to: ContentDifficulty;
};

/** Expected share of right answers per level; outside the band a question likely sits wrong. */
export const calibrationBands: Record<ContentDifficulty, { max: number; min: number }> = {
  easy: { max: 1, min: 0.6 },
  hard: { max: 0.65, min: 0 },
  medium: { max: 0.85, min: 0.4 },
};

/**
 * Proposes moving a question one level easier or harder when enough players answered it and its
 * accuracy is outside the band of its level. Slow answers nudge a borderline question harder.
 */
export function suggestDifficultyChanges(
  bank: { difficulty: ContentDifficulty; id: string }[],
  stats: QuestionStats[],
  minAttempts = 30
): DifficultySuggestion[] {
  const byId = new Map(stats.map((entry) => [entry.content_id, entry]));

  return bank.flatMap((question) => {
    const entry = byId.get(question.id);

    if (!entry || entry.attempts < minAttempts) {
      return [];
    }

    const accuracy = entry.correct / entry.attempts;
    const averageMs = entry.timed_answers > 0 ? entry.answer_ms_total / entry.timed_answers : null;
    const level = contentDifficulties.indexOf(question.difficulty);
    const band = calibrationBands[question.difficulty];
    // Players taking over 12 s on average are struggling even when they get it right.
    const slowPenalty = averageMs !== null && averageMs > 12_000 ? 0.05 : 0;
    const step = accuracy - slowPenalty > band.max ? -1 : accuracy - slowPenalty < band.min ? 1 : 0;
    const to = contentDifficulties[Math.min(2, Math.max(0, level + step))];

    return to === question.difficulty
      ? []
      : [{ accuracy, attempts: entry.attempts, averageMs, from: question.difficulty, id: question.id, to }];
  });
}
