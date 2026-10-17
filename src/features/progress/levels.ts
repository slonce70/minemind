// Levels and ranks from total XP.

/** Total XP needed to reach `level`: 0, 100, 300, 600, 1000… (each level 100 XP more than the last). */
export function xpForLevel(level: number) {
  return 50 * (level - 1) * level;
}

export function levelForXp(xp: number) {
  let level = 1;

  while (xpForLevel(level + 1) <= xp) {
    level += 1;
  }

  return level;
}

export function levelProgress(xp: number) {
  const level = levelForXp(xp);
  const floor = xpForLevel(level);
  const next = xpForLevel(level + 1);

  return { current: xp - floor, level, needed: next - floor };
}

export const ranks = [
  { id: 'wood', minLevel: 1 },
  { id: 'stone', minLevel: 4 },
  { id: 'iron', minLevel: 8 },
  { id: 'gold', minLevel: 13 },
  { id: 'diamond', minLevel: 20 },
  { id: 'netherite', minLevel: 30 },
] as const;

export type RankId = (typeof ranks)[number]['id'];

export function rankForLevel(level: number): RankId {
  return [...ranks].reverse().find((rank) => level >= rank.minLevel)?.id ?? 'wood';
}

