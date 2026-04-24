import type { ContentDifficulty } from './types';

export type DifficultyBadgeTone = 'success' | 'warning' | 'danger';

export type DifficultyConfigEntry = {
  badgeTone: DifficultyBadgeTone;
  scoreMultiplier: number;
  translationKey: string;
  timerSeconds: number;
};

export const difficultyConfig: Record<ContentDifficulty, DifficultyConfigEntry> = {
  easy: {
    badgeTone: 'success',
    scoreMultiplier: 1,
    translationKey: 'content.difficulty.easy',
    timerSeconds: 20,
  },
  medium: {
    badgeTone: 'warning',
    scoreMultiplier: 1.25,
    translationKey: 'content.difficulty.medium',
    timerSeconds: 18,
  },
  hard: {
    badgeTone: 'danger',
    scoreMultiplier: 2,
    translationKey: 'content.difficulty.hard',
    timerSeconds: 12,
  },
};
