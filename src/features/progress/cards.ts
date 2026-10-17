import { hashString } from '../../../supabase/functions/_shared/game-rules';
import { buildKubikSprite, type KubikBody, type KubikTop, type MascotMood, type PixelSpriteData } from '../ui/pixel-art';

// Collection cards: Kubik in costumes. All original pixel art (assets/LICENSES.md). Card ids are
// stored in saved progress: only add new ones.
export const cardRarities = ['common', 'rare', 'epic', 'legendary'] as const;

export type CardRarity = (typeof cardRarities)[number];

export type CardDefinition = {
  id: string;
  rarity: CardRarity;
  sprite: PixelSpriteData;
};

const bodies = {
  amber: { d: '#C9772E', o: '#F2A541', y: '#FFD27A' },
  amethyst: { d: '#6B3FA0', o: '#A070D8', y: '#D2B4F5' },
  coral: { d: '#C2526B', o: '#F27A92', y: '#FFC2CE' },
  diamond: { d: '#2A9DA8', o: '#5FE0E8', y: '#C8FBFF' },
  emerald: { d: '#1E8A4A', o: '#38C172', y: '#A6F0C2' },
  gold: { d: '#C99A12', o: '#F5CD30', y: '#FFF0A0' },
  ice: { d: '#5B8FC9', o: '#9CC8F2', y: '#E3F2FF' },
  lava: { d: '#B0331F', o: '#F0642E', y: '#FFB15C' },
  moss: { d: '#4F6B25', o: '#7FA23A', y: '#C2DB7A' },
  night: { d: '#1F1B33', o: '#3D3566', y: '#7468B0' },
  sand: { d: '#BFA36A', o: '#E8D29A', y: '#FFF4D2' },
  stone: { d: '#5E646C', o: '#9097A0', y: '#C8CDD3' },
} satisfies Record<string, KubikBody>;

function card(id: string, rarity: CardRarity, body: KubikBody, top: KubikTop, mood: MascotMood = 'happy'): CardDefinition {
  return { id, rarity, sprite: buildKubikSprite({ body, mood, top }) };
}

export const cardCatalog: readonly CardDefinition[] = [
  card('sprout', 'common', bodies.amber, 'sprout'),
  card('pebble', 'common', bodies.stone, 'bare'),
  card('sandy', 'common', bodies.sand, 'sprout'),
  card('mossy', 'common', bodies.moss, 'leaves'),
  card('miner', 'common', bodies.stone, 'helmet'),
  card('snowball', 'common', bodies.ice, 'snow'),
  card('shroom', 'common', bodies.coral, 'mushroom'),
  card('sleepy', 'common', bodies.night, 'bare', 'sad'),
  card('farmer', 'common', bodies.moss, 'sprout'),
  card('ember', 'common', bodies.lava, 'bare', 'wow'),
  card('frosty', 'rare', bodies.ice, 'horns'),
  card('glow-miner', 'rare', bodies.amber, 'helmet', 'wow'),
  card('forest-spirit', 'rare', bodies.emerald, 'leaves'),
  card('radio', 'rare', bodies.coral, 'antenna'),
  card('desert-king', 'rare', bodies.sand, 'crown'),
  card('lava-hopper', 'rare', bodies.lava, 'flame'),
  card('crystal', 'rare', bodies.amethyst, 'bare', 'wow'),
  card('night-owl', 'rare', bodies.night, 'horns'),
  card('emerald-trader', 'epic', bodies.emerald, 'crown'),
  card('amethyst-dreamer', 'epic', bodies.amethyst, 'halo'),
  card('blaze-heart', 'epic', bodies.gold, 'flame'),
  card('deep-diver', 'epic', bodies.diamond, 'helmet'),
  card('golden-kubik', 'legendary', bodies.gold, 'crown', 'wow'),
  card('diamond-kubik', 'legendary', bodies.diamond, 'halo', 'wow'),
];

export const cardsById = new Map(cardCatalog.map((entry) => [entry.id, entry]));

const rarityWeights: Record<'base' | 'boosted', Record<CardRarity, number>> = {
  base: { common: 70, epic: 7, legendary: 1, rare: 22 },
  // Perfect rounds and the daily quest roll here.
  boosted: { common: 40, epic: 16, legendary: 6, rare: 38 },
};

/**
 * Deterministic card roll: the same seed always gives the same card, so a reward replayed on
 * another device (cloud sync) is the same card. Cards the player doesn't own yet come first.
 */
export function rollCard(input: { boosted: boolean; owned: Record<string, number>; seed: string }): CardDefinition {
  const weights = rarityWeights[input.boosted ? 'boosted' : 'base'];
  const total = cardRarities.reduce((sum, rarity) => sum + weights[rarity], 0);
  let ticket = hashString(`${input.seed}:rarity`) % total;
  let rarity: CardRarity = 'common';

  for (const candidate of cardRarities) {
    if (ticket < weights[candidate]) {
      rarity = candidate;
      break;
    }

    ticket -= weights[candidate];
  }

  const pool = cardCatalog.filter((entry) => entry.rarity === rarity);
  const unowned = pool.filter((entry) => !input.owned[entry.id]);
  const choices = unowned.length > 0 ? unowned : pool;

  return choices[hashString(`${input.seed}:card`) % choices.length];
}
