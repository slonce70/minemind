import { normalizeQuizResultSummary } from './normalize-result-summary';
import type {
  MatchRecord,
  MatchSyncStatus,
  NormalizeMatchRecordInput,
} from './match-record';

function buildMatchRecordId({
  completedAt,
  mode,
  roomCode,
  score,
}: {
  completedAt: string;
  mode: MatchRecord['mode'];
  roomCode?: string;
  score: number;
}) {
  return [mode, roomCode ?? 'local', completedAt, String(score)].join(':');
}

function deriveSyncStatus(input: NormalizeMatchRecordInput): MatchSyncStatus {
  if (input.syncStatus) {
    return input.syncStatus;
  }

  if (input.transport === 'supabase' && input.authority === 'server') {
    return 'synced';
  }

  return 'local-only';
}

export function normalizeMatchRecord(input: NormalizeMatchRecordInput): MatchRecord {
  const normalized = normalizeQuizResultSummary(input.input) ?? input.input;

  return {
    authority: input.authority,
    bestStreak: normalized.bestStreak,
    breakdown: normalized.breakdown,
    completedAt: normalized.completedAt,
    correctAnswers: normalized.correctAnswers,
    difficulty: normalized.difficulty,
    id: buildMatchRecordId({
      completedAt: normalized.completedAt,
      mode: normalized.mode,
      roomCode: normalized.roomCode,
      score: normalized.score,
    }),
    isDemo: input.isDemo,
    mode: normalized.mode,
    participants: normalized.standings.map((entry) => ({
      isPlayer: entry.isPlayer,
      name: entry.name,
      score: entry.score,
    })),
    questionCount: normalized.questionCount,
    roomCode: normalized.roomCode,
    score: normalized.score,
    speedBonus: normalized.speedBonus,
    syncStatus: deriveSyncStatus(input),
    transport: input.transport,
  };
}
