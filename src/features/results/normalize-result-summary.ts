import type { QuizResultSummary } from '../quiz/types';

export function normalizeQuizResultSummary(
  result?: QuizResultSummary
): QuizResultSummary | undefined {
  if (!result) {
    return result;
  }

  const playerStanding = result.standings.find((entry) => entry.isPlayer);

  if (
    result.mode === 'room' &&
    result.standings.length > 1 &&
    playerStanding &&
    playerStanding.score !== result.score
  ) {
    return {
      ...result,
      score: playerStanding.score,
    };
  }

  let changed = false;

  const standings = result.standings.map((entry) => {
    if (!entry.isPlayer || entry.score === result.score) {
      return entry;
    }

    changed = true;

    return {
      ...entry,
      score: result.score,
    };
  });

  if (!changed) {
    return result;
  }

  return {
    ...result,
    standings: standings.sort((left, right) => right.score - left.score),
  };
}
