import type { MatchRecord } from '../results/match-record';

/** Totals over the matches kept on this device (the store keeps the last 20). */
export function summarizeMatches(matches: MatchRecord[]) {
  const answered = matches.reduce((sum, match) => sum + match.questionCount, 0);
  const correct = matches.reduce((sum, match) => sum + match.correctAnswers, 0);

  return {
    accuracy: answered > 0 ? Math.round((correct / answered) * 100) : 0,
    bestScore: matches.reduce((best, match) => Math.max(best, match.score), 0),
    bestStreak: matches.reduce((best, match) => Math.max(best, match.bestStreak), 0),
    matches: matches.length,
  };
}
