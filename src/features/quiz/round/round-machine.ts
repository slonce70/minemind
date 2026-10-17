// Question flow of a round, shared by solo, room and classroom: which question is on screen, the
// countdown, the player's answers and their verdicts. Pure: network and storage live in the mode
// adapters, which read `pendingAnswer` and report back with `verdict` / `verdict-failed`.
import { hashString } from '../../../../supabase/functions/_shared/game-rules';
import type { LifelineId, QuizAnswerMap, QuizQuestion } from '../types';

/** Seconds a "+time" hint adds. */
export const extraTimeSeconds = 10;

export type AnswerVerdict = {
  correctIndex?: number;
  explanation?: string;
  isCorrect?: boolean;
};

export type PendingAnswer = {
  optionIndex: number;
  questionId: string;
  timeLeft: number;
};

export type RoundState = {
  answerMap: QuizAnswerMap;
  /** The mode checks answers remotely (live room, classroom guest): wait for a verdict. */
  awaitsVerdict: boolean;
  currentIndex: number;
  isRevealed: boolean;
  isSubmittingAnswer: boolean;
  /** Hints left this round (solo only: rooms are scored on the server). */
  lifelines: Record<LifelineId, number>;
  /** Hints used per question, for the score and the record. */
  lifelinesUsed: Record<string, LifelineId[]>;
  /** Options a 50/50 removed from the current question. */
  hiddenOptions: number[];
  /** An answer the mode adapter still has to send. */
  pendingAnswer: PendingAnswer | null;
  questions: QuizQuestion[];
  selectedIndex: number | null;
  timeLeft: number;
  timeLimit: number;
};

export type RoundAction =
  | {
      type: 'load';
      answers?: QuizAnswerMap;
      awaitsVerdict: boolean;
      lifelines?: Record<LifelineId, number>;
      questions: QuizQuestion[];
      timeLimit: number;
    }
  | { type: 'lifeline'; lifeline: LifelineId }
  | { type: 'tick' }
  | { type: 'answer'; optionIndex: number; timeLeft: number }
  | { type: 'answer-sent' }
  | { type: 'verdict'; questionId: string; verdict: AnswerVerdict }
  | { type: 'verdict-failed'; explanation: string; markWrong: boolean; questionId: string }
  | { type: 'next' }
  /**
   * Live rooms: the server timeline moves the round instead of the tick countdown and the
   * "next" button. `questions` grows as the server releases them.
   */
  | { type: 'timeline'; index: number; isClosed: boolean; questions: QuizQuestion[]; timeLeft: number };

export const initialRoundState: RoundState = {
  answerMap: {},
  awaitsVerdict: false,
  currentIndex: 0,
  hiddenOptions: [],
  isRevealed: false,
  isSubmittingAnswer: false,
  lifelines: { fifty: 0, time: 0 },
  lifelinesUsed: {},
  pendingAnswer: null,
  questions: [],
  selectedIndex: null,
  timeLeft: 0,
  timeLimit: 0,
};

function answer(state: RoundState, optionIndex: number, timeLeft: number): RoundState {
  const question = state.questions[state.currentIndex];

  if (!question || state.isRevealed) {
    return state;
  }

  return {
    ...state,
    answerMap: {
      ...state.answerMap,
      [question.id]: {
        selectedIndex: optionIndex,
        timeLeft,
        ...(state.lifelinesUsed[question.id] ? { lifelines: state.lifelinesUsed[question.id] } : {}),
      },
    },
    isRevealed: true,
    isSubmittingAnswer: state.awaitsVerdict,
    pendingAnswer: state.awaitsVerdict ? { optionIndex, questionId: question.id, timeLeft } : null,
    selectedIndex: optionIndex,
  };
}

function mergeVerdict(state: RoundState, questionId: string, verdict: AnswerVerdict): RoundState {
  const current = state.answerMap[questionId];

  if (!current) {
    return state;
  }

  return {
    ...state,
    answerMap: { ...state.answerMap, [questionId]: { ...current, ...verdict } },
    isSubmittingAnswer: false,
  };
}

function spendLifeline(state: RoundState, lifeline: LifelineId): RoundState {
  const question = state.questions[state.currentIndex];
  const used = question ? (state.lifelinesUsed[question.id] ?? []) : [];

  if (!question || state.isRevealed || state.lifelines[lifeline] <= 0 || used.includes(lifeline)) {
    return state;
  }

  const spend = {
    lifelines: { ...state.lifelines, [lifeline]: state.lifelines[lifeline] - 1 },
    lifelinesUsed: { ...state.lifelinesUsed, [question.id]: [...used, lifeline] },
  };

  if (lifeline === 'time') {
    return { ...state, ...spend, timeLeft: state.timeLeft + extraTimeSeconds };
  }

  // 50/50 needs the answer on the device and four options.
  if (typeof question.correctIndex !== 'number' || question.options.length < 4) {
    return state;
  }

  const wrong = question.options.map((_, index) => index).filter((index) => index !== question.correctIndex);
  const keep = wrong[hashString(question.id) % wrong.length];

  return { ...state, ...spend, hiddenOptions: wrong.filter((index) => index !== keep) };
}

export function roundReducer(state: RoundState, action: RoundAction): RoundState {
  switch (action.type) {
    case 'load': {
      const answers = action.answers ?? {};
      // Reconnecting: continue at the first question the player has not answered yet.
      const firstOpenIndex = action.questions.findIndex((question) => !answers[question.id]);
      const currentIndex = firstOpenIndex === -1 ? Math.max(0, action.questions.length - 1) : firstOpenIndex;
      const currentAnswer = action.questions[currentIndex] ? answers[action.questions[currentIndex].id] : undefined;

      return {
        ...initialRoundState,
        answerMap: answers,
        awaitsVerdict: action.awaitsVerdict,
        currentIndex,
        isRevealed: Boolean(currentAnswer),
        lifelines: action.lifelines ?? initialRoundState.lifelines,
        questions: action.questions,
        selectedIndex: currentAnswer?.selectedIndex ?? null,
        timeLeft: action.timeLimit,
        timeLimit: action.timeLimit,
      };
    }
    case 'tick': {
      if (!state.questions[state.currentIndex] || state.isRevealed) {
        return state;
      }

      // Time is up: the question counts as unanswered.
      return state.timeLeft <= 1 ? { ...answer(state, -1, 0), timeLeft: 0 } : { ...state, timeLeft: state.timeLeft - 1 };
    }
    case 'answer':
      return answer(state, action.optionIndex, action.timeLeft);
    case 'lifeline':
      return spendLifeline(state, action.lifeline);
    case 'answer-sent':
      return { ...state, pendingAnswer: null };
    case 'verdict':
      return mergeVerdict(state, action.questionId, action.verdict);
    case 'verdict-failed':
      return mergeVerdict(state, action.questionId, {
        explanation: action.explanation,
        ...(action.markWrong ? { isCorrect: false } : {}),
      });
    case 'timeline': {
      let next: RoundState = { ...state, questions: action.questions, timeLeft: action.timeLeft };

      if (action.index !== state.currentIndex) {
        const question = action.questions[action.index];
        const existing = question ? state.answerMap[question.id] : undefined;

        next = {
          ...next,
          currentIndex: action.index,
          isRevealed: Boolean(existing),
          isSubmittingAnswer: false,
          selectedIndex: existing?.selectedIndex ?? null,
        };
      }

      // The question closed without an answer: it counts as missed (the server agrees).
      return action.isClosed && !next.isRevealed ? { ...answer(next, -1, 0), timeLeft: 0 } : next;
    }
    case 'next':
      if (state.currentIndex >= state.questions.length - 1) {
        return state;
      }

      return {
        ...state,
        currentIndex: state.currentIndex + 1,
        hiddenOptions: [],
        isRevealed: false,
        isSubmittingAnswer: false,
        selectedIndex: null,
        timeLeft: state.timeLimit,
      };
  }
}
