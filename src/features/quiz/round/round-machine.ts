// Question flow of a round, shared by solo, room and classroom: which question is on screen, the
// countdown, the player's answers and their verdicts. Pure: network and storage live in the mode
// adapters, which read `pendingAnswer` and report back with `verdict` / `verdict-failed`.
import type { QuizAnswerMap, QuizQuestion } from '../types';

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
  /** An answer the mode adapter still has to send. */
  pendingAnswer: PendingAnswer | null;
  questions: QuizQuestion[];
  selectedIndex: number | null;
  timeLeft: number;
  timeLimit: number;
};

export type RoundAction =
  | { type: 'load'; answers?: QuizAnswerMap; awaitsVerdict: boolean; questions: QuizQuestion[]; timeLimit: number }
  | { type: 'tick' }
  | { type: 'answer'; optionIndex: number; timeLeft: number }
  | { type: 'answer-sent' }
  | { type: 'verdict'; questionId: string; verdict: AnswerVerdict }
  | { type: 'verdict-failed'; explanation: string; markWrong: boolean; questionId: string }
  | { type: 'next' };

export const initialRoundState: RoundState = {
  answerMap: {},
  awaitsVerdict: false,
  currentIndex: 0,
  isRevealed: false,
  isSubmittingAnswer: false,
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
    answerMap: { ...state.answerMap, [question.id]: { selectedIndex: optionIndex, timeLeft } },
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
    case 'answer-sent':
      return { ...state, pendingAnswer: null };
    case 'verdict':
      return mergeVerdict(state, action.questionId, action.verdict);
    case 'verdict-failed':
      return mergeVerdict(state, action.questionId, {
        explanation: action.explanation,
        ...(action.markWrong ? { isCorrect: false } : {}),
      });
    case 'next':
      if (state.currentIndex >= state.questions.length - 1) {
        return state;
      }

      return {
        ...state,
        currentIndex: state.currentIndex + 1,
        isRevealed: false,
        isSubmittingAnswer: false,
        selectedIndex: null,
        timeLeft: state.timeLimit,
      };
  }
}
