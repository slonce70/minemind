import type { ContentTopicId } from './types';

type TopicRule = {
  icon: string;
  priority: number;
  translationKey: string;
};

export const minecraftTopicConfig: Record<ContentTopicId, TopicRule> = {
  'biomes-and-structures': {
    icon: 'map',
    priority: 1,
    translationKey: 'content.topic.biomesAndStructures',
  },
  'blocks-and-building': {
    icon: 'block',
    priority: 1,
    translationKey: 'content.topic.blocksAndBuilding',
  },
  'crafting-and-smelting': {
    icon: 'crafting-table',
    priority: 1,
    translationKey: 'content.topic.craftingAndSmelting',
  },
  'farming-and-animals': {
    icon: 'wheat',
    priority: 1,
    translationKey: 'content.topic.farmingAndAnimals',
  },
  'mobs-and-combat': {
    icon: 'sword',
    priority: 1,
    translationKey: 'content.topic.mobsAndCombat',
  },
  'nether-end-and-redstone': {
    icon: 'portal',
    priority: 1,
    translationKey: 'content.topic.netherEndAndRedstone',
  },
  'survival-basics': {
    icon: 'pickaxe',
    priority: 1,
    translationKey: 'content.topic.survivalBasics',
  },
  'villagers-and-enchanting': {
    icon: 'emerald',
    priority: 1,
    translationKey: 'content.topic.villagersAndEnchanting',
  },
};
