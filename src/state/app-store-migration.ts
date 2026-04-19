import type { ContentDifficulty } from '../features/content/types';
import { normalizeMatchRecord } from '../features/results/normalize-match-record';
import type { MatchRecord } from '../features/results/match-record';
import type { QuizResultSummary } from '../features/quiz/types';

type PersistedAppStateLike = {
  lastMatchId?: string;
  lastResult?: QuizResultSummary;
  recentMatches?: MatchRecord[];
  selectedDifficulty?: ContentDifficulty;
} & Record<string, unknown>;

function migrateLegacyLastResult(lastResult?: QuizResultSummary) {
  if (!lastResult) {
    return [];
  }

  return [
    normalizeMatchRecord({
      authority: 'client',
      input: lastResult,
      isDemo: false,
      syncStatus: 'recovered',
      transport: 'local',
    }),
  ];
}

export function migratePersistedAppState(persistedState: unknown) {
  if (!persistedState || typeof persistedState !== 'object') {
    return {
      recentMatches: [] as MatchRecord[],
      selectedDifficulty: 'medium' as ContentDifficulty,
    };
  }

  const state = persistedState as PersistedAppStateLike;
  const recentMatches = Array.isArray(state.recentMatches)
    ? state.recentMatches
    : migrateLegacyLastResult(state.lastResult);

  return {
    ...state,
    lastMatchId: state.lastMatchId ?? recentMatches[0]?.id,
    lastResult: undefined,
    recentMatches,
    selectedDifficulty: state.selectedDifficulty ?? 'medium',
  };
}
