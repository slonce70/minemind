// Shared by the app (src/) and the Edge Functions. Keep this file dependency-free so both
// Metro and Deno can import it.

export type GameDifficulty = 'easy' | 'medium' | 'hard';

export const gameDifficulties: readonly GameDifficulty[] = ['easy', 'medium', 'hard'];

export const difficultyRules: Record<GameDifficulty, { scoreMultiplier: number; timerSeconds: number }> = {
  easy: { scoreMultiplier: 1, timerSeconds: 20 },
  medium: { scoreMultiplier: 1.25, timerSeconds: 18 },
  hard: { scoreMultiplier: 1.5, timerSeconds: 15 },
};

export const baseAnswerScore = 100;
export const speedBonusPerSecond = 6;
// Extra time the server allows for network latency before a question counts as missed.
export const answerGraceMs = 3000;

// Self-paced rounds (classroom): time a player gets between questions to read the explanation
// and tap "next", and slack for loading the round on slower phones.
export const betweenQuestionsAllowanceMs = 10_000;
export const roundStartAllowanceMs = 30_000;

// Live rooms run on one server timeline: a countdown, then each question opens for the timer and
// is followed by the answer and the standings before the next one opens.
export const roundLeadInMs = 5_000;
export const betweenQuestionsMs = 10_000;

export function questionWindow(input: { difficulty: GameDifficulty; index: number; startedAt: Date }) {
  const timerMs = difficultyRules[input.difficulty].timerSeconds * 1000;
  const opensAt = input.startedAt.getTime() + roundLeadInMs + input.index * (timerMs + betweenQuestionsMs);

  return { closesAt: new Date(opensAt + timerMs), opensAt: new Date(opensAt) };
}

/** Live room deadline: the last question closes (plus network grace). */
export function computeTimelineEndsAt(input: { difficulty: GameDifficulty; questionCount: number; startedAt: Date }) {
  const last = questionWindow({ ...input, index: Math.max(0, input.questionCount - 1) });

  return new Date(last.closesAt.getTime() + answerGraceMs);
}

// A question is handed out this long before it opens, so it is on screen right on time.
export const questionPrefetchMs = 2_000;

type TimelineInput = { difficulty: GameDifficulty; now: Date; questionCount: number; startedAt: Date };

/** How many questions players may see by `now` (each a little before it opens). */
export function countReleasedQuestions(input: TimelineInput) {
  let released = 0;

  while (
    released < input.questionCount &&
    questionWindow({ ...input, index: released }).opensAt.getTime() - questionPrefetchMs <= input.now.getTime()
  ) {
    released += 1;
  }

  return released;
}

/** How many questions are closed for good (answers are final), for the standings in between. */
export function countClosedQuestions(input: TimelineInput) {
  let closed = 0;

  while (
    closed < input.questionCount &&
    questionWindow({ ...input, index: closed }).closesAt.getTime() + answerGraceMs <= input.now.getTime()
  ) {
    closed += 1;
  }

  return closed;
}

/** Self-paced deadline (classroom): every question plus reading time, generously. */
export function computeRoundEndsAt(input: {
  difficulty: GameDifficulty;
  questionCount: number;
  startedAt: Date;
}) {
  const perQuestionMs = difficultyRules[input.difficulty].timerSeconds * 1000 + betweenQuestionsAllowanceMs;

  return new Date(input.startedAt.getTime() + roundStartAllowanceMs + perQuestionMs * input.questionCount);
}

export function isGameDifficulty(value: unknown): value is GameDifficulty {
  return gameDifficulties.includes(value as GameDifficulty);
}

export function speedBonusForTimeLeft(timeLeftMs: number) {
  return Math.floor(Math.max(0, timeLeftMs) / 1000) * speedBonusPerSecond;
}

export function scoreAnswer(input: {
  difficulty?: GameDifficulty;
  isCorrect: boolean;
  timeLeftMs: number;
}) {
  if (!input.isCorrect) {
    return 0;
  }

  const multiplier = input.difficulty ? difficultyRules[input.difficulty].scoreMultiplier : 1;

  return Math.round((baseAnswerScore + speedBonusForTimeLeft(input.timeLeftMs)) * multiplier);
}

export function hashString(input: string) {
  let hash = 2166136261;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

// mulberry32 seeded from the string hash: same seed -> same sequence on every device.
function seededRandom(seed: string) {
  let state = hashString(seed);

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/** Returns `order` where displayed option i is original option order[i]. */
export function seededPermutation(length: number, seed: string) {
  const random = seededRandom(seed);
  const order = Array.from({ length }, (_, index) => index);

  for (let index = length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [order[index], order[swapIndex]] = [order[swapIndex], order[index]];
  }

  return order;
}

export function shuffleOptions<TOption>(options: TOption[], correctIndex: number, seed: string) {
  const order = seededPermutation(options.length, seed);

  return {
    correctIndex: order.indexOf(correctIndex),
    options: order.map((originalIndex) => options[originalIndex]),
    order,
  };
}
