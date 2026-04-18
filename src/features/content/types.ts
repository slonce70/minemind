export const contentLocales = ['uk', 'en', 'ru'] as const;

export type ContentLocale = (typeof contentLocales)[number];

export type LocalizedString = Record<ContentLocale, string>;

export const contentDifficulties = ['easy', 'medium', 'hard'] as const;

export type ContentDifficulty = (typeof contentDifficulties)[number];

export const contentDifficultyEnum = Object.freeze({
  easy: contentDifficulties[0],
  medium: contentDifficulties[1],
  hard: contentDifficulties[2],
});

export const contentDifficultyValues = contentDifficulties as [
  ContentDifficulty,
  ContentDifficulty,
  ContentDifficulty,
];

export const contentCategoryIds = ['minecraft'] as const;

export type ContentCategoryId = (typeof contentCategoryIds)[number];

export const contentCategoryEnum = Object.freeze({
  minecraft: contentCategoryIds[0],
});

export const contentAgeBands = ['8-12', '13-15', '16+'] as const;

export type ContentAgeBand = (typeof contentAgeBands)[number];

export const contentAgeBandEnum = Object.freeze({
  '8-12': contentAgeBands[0],
  '13-15': contentAgeBands[1],
  '16+': contentAgeBands[2],
});

export const contentAgeBandValues = contentAgeBands as [
  ContentAgeBand,
  ContentAgeBand,
  ContentAgeBand,
];

export const contentTopics = [
  'survival-basics',
  'crafting-and-smelting',
  'blocks-and-building',
  'mobs-and-combat',
  'farming-and-animals',
  'villagers-and-enchanting',
  'biomes-and-structures',
  'nether-end-and-redstone',
] as const;

export type ContentTopicId = (typeof contentTopics)[number];

export const contentTopicEnum = Object.freeze({
  survivalBasics: contentTopics[0],
  craftingAndSmelting: contentTopics[1],
  blocksAndBuilding: contentTopics[2],
  mobsAndCombat: contentTopics[3],
  farmingAndAnimals: contentTopics[4],
  villagersAndEnchanting: contentTopics[5],
  biomesAndStructures: contentTopics[6],
  netherEndAndRedstone: contentTopics[7],
});

export const contentTopicValues = contentTopics as [
  ContentTopicId,
  ContentTopicId,
  ContentTopicId,
  ContentTopicId,
  ContentTopicId,
  ContentTopicId,
  ContentTopicId,
  ContentTopicId,
];

export type ContentQuestionRecord = {
  ageBand: ContentAgeBand;
  categoryId: ContentCategoryId;
  correctIndex: number;
  difficulty: ContentDifficulty;
  explanation: LocalizedString;
  id: string;
  isActive: boolean;
  options: [LocalizedString, LocalizedString, LocalizedString, LocalizedString];
  prompt: LocalizedString;
  sourceVersion: string;
  tags: string[];
  topicId: ContentTopicId;
};

export type ContentQuestionBank = ContentQuestionRecord[];
