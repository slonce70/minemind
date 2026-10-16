import {
  answerGraceMs,
  type GameDifficulty,
  questionWindow,
} from '../../../../supabase/functions/_shared/game-rules';

export type TimelinePhase =
  | { kind: 'lead-in'; secondsLeft: number }
  | { index: number; kind: 'question'; secondsLeft: number }
  /** After question `index` closed: its answer and the standings until the next one opens. */
  | { index: number; kind: 'between'; secondsLeft: number }
  | { kind: 'over' };

const secondsUntil = (target: Date, now: Date) => Math.max(0, Math.ceil((target.getTime() - now.getTime()) / 1000));

/** Where a live room round is at `now` (server-aligned clock). */
export function describeTimeline(input: {
  difficulty: GameDifficulty;
  now: Date;
  questionCount: number;
  startedAt: Date;
}): TimelinePhase {
  const first = questionWindow({ ...input, index: 0 });

  if (input.now < first.opensAt) {
    return { kind: 'lead-in', secondsLeft: secondsUntil(first.opensAt, input.now) };
  }

  for (let index = 0; index < input.questionCount; index += 1) {
    const { closesAt } = questionWindow({ ...input, index });

    if (input.now < closesAt) {
      return { index, kind: 'question', secondsLeft: secondsUntil(closesAt, input.now) };
    }

    const isLast = index === input.questionCount - 1;
    const nextBoundary = isLast
      ? new Date(closesAt.getTime() + answerGraceMs)
      : questionWindow({ ...input, index: index + 1 }).opensAt;

    if (input.now < nextBoundary) {
      return { index, kind: 'between', secondsLeft: secondsUntil(nextBoundary, input.now) };
    }
  }

  return { kind: 'over' };
}
