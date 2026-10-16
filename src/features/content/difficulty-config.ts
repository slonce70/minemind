import { difficultyRules } from '../../../supabase/functions/_shared/game-rules';
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
    ...difficultyRules.easy,
    badgeTone: 'success',
    translationKey: 'content.difficulty.easy',
  },
  medium: {
    ...difficultyRules.medium,
    badgeTone: 'warning',
    translationKey: 'content.difficulty.medium',
  },
  hard: {
    ...difficultyRules.hard,
    badgeTone: 'danger',
    translationKey: 'content.difficulty.hard',
  },
};
