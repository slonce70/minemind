import type { ContentDifficulty } from './room-settings.ts';

// Per-question timer in seconds, mirroring src/features/content/difficulty-config.ts.
// Kept in sync manually because Edge Functions cannot import app source.
const TIMER_SECONDS: Record<ContentDifficulty, number> = {
  easy: 20,
  medium: 18,
  hard: 12,
};

// Extra wall-clock allowance on top of the theoretical round length to absorb
// network latency, question transitions, and clock skew before a round is
// considered closed for late submissions.
const NETWORK_GRACE_MS = 8000;

export function questionTimerMs(difficulty: ContentDifficulty): number {
  return TIMER_SECONDS[difficulty] * 1000;
}

/**
 * Absolute deadline for a round: enough wall-clock for every question timer
 * plus a network grace window. Submissions past this point are rejected so a
 * disconnected/stalled player can no longer block finalize indefinitely and
 * cannot backfill answers after the round has effectively ended.
 */
export function computeRoundEndsAt(
  startedAtIso: string,
  difficulty: ContentDifficulty,
  questionCount: number
): string {
  const startedAt = new Date(startedAtIso).getTime();
  const durationMs = questionTimerMs(difficulty) * Math.max(1, questionCount) + NETWORK_GRACE_MS;
  return new Date(startedAt + durationMs).toISOString();
}

/**
 * Clamp the client-reported remaining time to the physical per-question timer.
 * The client is not trusted; without per-question server timestamps this bounds
 * the speed bonus to at most one full timer instead of an arbitrary value.
 */
export function clampTimeLeftMs(
  timeLeftMs: number | undefined,
  difficulty: ContentDifficulty
): number {
  const max = questionTimerMs(difficulty);
  if (typeof timeLeftMs !== 'number' || !Number.isFinite(timeLeftMs)) {
    return 0;
  }
  return Math.max(0, Math.min(max, Math.floor(timeLeftMs)));
}
