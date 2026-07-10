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

export type MigratedAppState = {
  lastMatchId?: string;
  lastResult: undefined;
  recentMatches: MatchRecord[];
  selectedDifficulty: ContentDifficulty;
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

/**
 * Records persisted by older versions may predate fields the UI now assumes
 * (e.g. `participants`, which results-view slices directly). Backfill missing
 * fields so a stale record can never crash the results screen with a TypeError.
 */
function sanitizeMatchRecord(record: MatchRecord): MatchRecord {
  return {
    ...record,
    breakdown: Array.isArray(record.breakdown) ? record.breakdown : [],
    participants: Array.isArray(record.participants) ? record.participants : [],
  };
}

export function migratePersistedAppState(
  persistedState: unknown,
  _version?: number
): MigratedAppState {
  if (!persistedState || typeof persistedState !== 'object') {
    return {
      lastMatchId: undefined,
      lastResult: undefined,
      recentMatches: [],
      selectedDifficulty: 'medium',
    };
  }

  const state = persistedState as PersistedAppStateLike;
  const rawRecentMatches = Array.isArray(state.recentMatches)
    ? state.recentMatches
    : migrateLegacyLastResult(state.lastResult);
  const recentMatches = rawRecentMatches.map(sanitizeMatchRecord);

  return {
    ...state,
    lastMatchId: state.lastMatchId ?? recentMatches[0]?.id,
    lastResult: undefined,
    recentMatches,
    selectedDifficulty: state.selectedDifficulty ?? 'medium',
  };
}
