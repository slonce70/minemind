import { contentTopics } from '../content/types';
import type { PixelIconName } from '../ui/pixel-art';
import { cardCatalog } from './cards';
import { levelForXp } from './levels';
import type { PlayerProgress } from './progression';

type AchievementDefinition = {
  icon: PixelIconName;
  id: string;
  isUnlocked: (progress: PlayerProgress) => boolean;
};

const stat = (progress: PlayerProgress, key: keyof PlayerProgress['stats']) => progress.stats[key] ?? 0;

// Ids are stored in saved progress: only add new ones. Names and descriptions live in i18n
// under achievements.<id>.
export const achievementCatalog = [
  { icon: 'play', id: 'first-round', isUnlocked: (p) => stat(p, 'matches') >= 1 },
  { icon: 'play', id: 'rounds-10', isUnlocked: (p) => stat(p, 'matches') >= 10 },
  { icon: 'play', id: 'rounds-50', isUnlocked: (p) => stat(p, 'matches') >= 50 },
  { icon: 'check', id: 'correct-100', isUnlocked: (p) => stat(p, 'correct') >= 100 },
  { icon: 'check', id: 'correct-500', isUnlocked: (p) => stat(p, 'correct') >= 500 },
  { icon: 'star', id: 'perfect-round', isUnlocked: (p) => stat(p, 'perfect') >= 1 },
  { icon: 'star', id: 'perfect-5', isUnlocked: (p) => stat(p, 'perfect') >= 5 },
  { icon: 'trophy', id: 'hard-perfect', isUnlocked: (p) => stat(p, 'hardPerfect') >= 1 },
  { icon: 'flame', id: 'days-3', isUnlocked: (p) => p.streak.best >= 3 },
  { icon: 'flame', id: 'days-7', isUnlocked: (p) => p.streak.best >= 7 },
  { icon: 'flame', id: 'days-30', isUnlocked: (p) => p.streak.best >= 30 },
  { icon: 'trophy', id: 'level-5', isUnlocked: (p) => levelForXp(p.xp) >= 5 },
  { icon: 'trophy', id: 'level-10', isUnlocked: (p) => levelForXp(p.xp) >= 10 },
  { icon: 'card', id: 'cards-10', isUnlocked: (p) => Object.keys(p.cards).length >= 10 },
  { icon: 'card', id: 'cards-all', isUnlocked: (p) => cardCatalog.every((card) => p.cards[card.id]) },
  { icon: 'people', id: 'team-player', isUnlocked: (p) => stat(p, 'multiplayer') >= 1 },
  { icon: 'people', id: 'challenger', isUnlocked: (p) => stat(p, 'challenges') >= 1 },
  { icon: 'book', id: 'mistake-fixer', isUnlocked: (p) => stat(p, 'mistakesFixed') >= 10 },
  { icon: 'block', id: 'all-topics', isUnlocked: (p) => contentTopics.every((topic) => (p.topicCorrect[topic] ?? 0) >= 10) },
] as const satisfies readonly AchievementDefinition[];

export type AchievementId = (typeof achievementCatalog)[number]['id'];
