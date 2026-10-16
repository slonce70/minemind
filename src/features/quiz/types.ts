import type { AppLocale } from '../../lib/locale';
import type { ContentDifficulty, ContentTopicId } from '../content/types';

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
  /** Known for questions from the local bank; drives the topic icon on the question card. */
  topicId?: ContentTopicId;
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

export type SoloMode = 'classic' | 'topic' | 'adaptive' | 'mistakes' | 'challenge';

/** How a solo round was built; kept on the match record for rewards, replays and challenges. */
export type RoundVariant = {
  /** The friend challenge this round answered: their name and score from the link. */
  challenge?: { from: string; score: number };
  lifelinesUsed?: number;
  /** Seed of the question set, so a friend can get the very same round. */
  seed?: string;
  soloMode: SoloMode;
  topicId?: ContentTopicId;
};

export type QuizResultSummary = {
  bestStreak: number;
  breakdown: {
    /** Missing in records saved before the full review existed. */
    correctIndex?: number;
    explanation: string;
    isCorrect: boolean;
    options?: string[];
    prompt: string;
    questionId: string;
    selectedIndex: number;
  }[];
  completedAt: string;
  correctAnswers: number;
  difficulty?: ContentDifficulty;
  mode: 'room' | 'solo';
  questionCount: number;
  roomCode?: string;
  round?: RoundVariant;
  score: number;
  speedBonus: number;
  standings: {
    isPlayer: boolean;
    name: string;
    score: number;
  }[];
};
