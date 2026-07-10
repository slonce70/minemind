import type { ActiveRoomRound } from '../rooms/types';
import type { QuizResultSummary } from '../quiz/types';
import { normalizeMatchRecord } from './normalize-match-record';

type RankingEntry = {
  best_streak: number;
  correct_count: number;
  nickname: string;
  player_id: string;
  rank: number;
  round_id: string;
  score: number;
};

function buildRecoveredRoomSummary(
  round: ActiveRoomRound,
  rankings: RankingEntry[],
  currentUserId: string
): QuizResultSummary {
  const playerRanking = rankings.find((entry) => entry.player_id === currentUserId);
  const correctAnswers = playerRanking?.correct_count ?? 0;
  const score = playerRanking?.score ?? 0;

  return {
    bestStreak: playerRanking?.best_streak ?? 0,
    breakdown: [],
    completedAt: new Date().toISOString(),
    correctAnswers,
    difficulty: round.difficulty,
    mode: 'room',
    questionCount: round.questions.length,
    roomCode: round.roomCode,
    score,
    speedBonus: Math.max(0, score - correctAnswers * 100),
    standings: rankings
      .slice()
      .sort((left, right) => left.rank - right.rank)
      .map((entry) => ({
        isPlayer: entry.player_id === currentUserId,
        name: entry.nickname,
        score: entry.score,
      })),
  };
}

export function buildRecoveredRoomResult(
  round: ActiveRoomRound,
  rankings: RankingEntry[],
  currentUserId: string
) {
  return normalizeMatchRecord({
    authority: 'server',
    input: buildRecoveredRoomSummary(round, rankings, currentUserId),
    isDemo: false,
    roundId: round.roundId,
    syncStatus: 'synced',
    transport: 'supabase',
  });
}

export function normalizeClassroomResult(summary: QuizResultSummary) {
  return normalizeMatchRecord({
    authority: 'host-device',
    input: summary,
    isDemo: false,
    modeOverride: 'classroom',
    syncStatus: 'local-only',
    transport: 'lan-host',
  });
}
