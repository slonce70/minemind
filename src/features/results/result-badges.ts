import { difficultyConfig } from '../content/difficulty-config';
import type { ContentDifficulty } from '../content/types';

export function getResultBadgeModel(input: {
  difficulty: ContentDifficulty;
  perfectRound: boolean;
}) {
  if (input.difficulty === 'hard' && input.perfectRound) {
    return {
      icon: 'portal' as const,
      id: 'nether-pro-perfect',
      labelKey: 'results.badges.netherPerfect',
      tone: difficultyConfig.hard.badgeTone,
    };
  }

  if (input.perfectRound) {
    return {
      icon: 'trophy' as const,
      id: 'perfect-clear',
      labelKey: 'results.badges.perfectClear',
      tone: difficultyConfig[input.difficulty].badgeTone,
    };
  }

  return {
    icon: 'pickaxe' as const,
    id: 'standard-clear',
    labelKey: 'results.badges.standardClear',
    tone: difficultyConfig[input.difficulty].badgeTone,
  };
}
