import type { AppLocale } from '../../lib/locale';

export type LocalizedString = Record<AppLocale, string>;

export type LocalizedQuestionDefinition = {
  correctIndex: number;
  explanation: LocalizedString;
  id: string;
  options: LocalizedString[];
  prompt: LocalizedString;
};

export type QuizQuestion = {
  correctIndex?: number;
  explanation?: string;
  id: string;
  options: string[];
  prompt: string;
};

export type QuizAnswerMap = Record<
  string,
  {
    correctIndex?: number;
    explanation?: string;
    isCorrect?: boolean;
    selectedIndex: number;
    timeLeft: number;
  }
>;

export type QuizResultSummary = {
  bestStreak: number;
  breakdown: {
    explanation: string;
    isCorrect: boolean;
    prompt: string;
    questionId: string;
    selectedIndex: number;
  }[];
  completedAt: string;
  correctAnswers: number;
  mode: 'room' | 'solo';
  questionCount: number;
  roomCode?: string;
  score: number;
  speedBonus: number;
  standings: {
    isPlayer: boolean;
    name: string;
    score: number;
  }[];
};
