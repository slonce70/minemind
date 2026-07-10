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
  roundId,
  score,
}: {
  completedAt: string;
  mode: MatchRecord['mode'];
  roomCode?: string;
  roundId?: string;
  score: number;
}) {
  // A round id is the stable anchor when available (room/live rounds). Solo and
  // demo rounds have none, so fall back to completedAt + score, which are
  // unique enough per play.
  if (roundId) {
    return [mode, roomCode ?? 'local', 'round', roundId].join(':');
  }

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
  const mode = input.modeOverride ?? normalized.mode;

  return {
    authority: input.authority,
    bestStreak: normalized.bestStreak,
    breakdown: normalized.breakdown,
    completedAt: normalized.completedAt,
    correctAnswers: normalized.correctAnswers,
    difficulty: normalized.difficulty,
    id: buildMatchRecordId({
      completedAt: normalized.completedAt,
      mode,
      roomCode: normalized.roomCode,
      roundId: input.roundId,
      score: normalized.score,
    }),
    isDemo: input.isDemo,
    mode,
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
