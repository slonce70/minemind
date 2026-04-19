import type { ContentDifficulty, ContentTopicId } from './types';

export const canonScopes = ['common-canon', 'java-only', 'bedrock-only'] as const;

export type CanonScope = (typeof canonScopes)[number];

export const masterQuestionReviewStatuses = [
  'draft',
  'auto-validated',
  'editor-reviewed',
  'approved',
  'rejected',
] as const;

export type MasterQuestionReviewStatus = (typeof masterQuestionReviewStatuses)[number];

export const translationStatuses = ['not-started', 'in-progress', 'complete'] as const;

export type TranslationStatus = (typeof translationStatuses)[number];

export const minecraftQuestionProgramTarget = {
  totalQuestions: 1080,
  topics: 8,
  difficulties: 3,
  questionsPerTopicPerDifficulty: 45,
  questionsPerClusterPerDifficulty: 15,
} as const;

export const minecraftTopicClusters: Record<ContentTopicId, [string, string, string]> = {
  'survival-basics': ['health-hunger-safety', 'spawn-night-shelter', 'movement-hazards-utility'],
  'crafting-and-smelting': ['stations-recipes', 'tools-fuel-smelting', 'materials-progression'],
  'blocks-and-building': ['natural-materials', 'block-behavior', 'utility-building-blocks'],
  'mobs-and-combat': ['passive-neutral-mobs', 'hostile-mobs', 'combat-safety'],
  'farming-and-animals': ['crops-growth', 'animals-breeding', 'food-farm-loops'],
  'villagers-and-enchanting': ['professions-workstations', 'trading-economy', 'enchanting-upgrades'],
  'biomes-and-structures': ['biome-recognition', 'natural-generated-structures', 'loot-and-purpose'],
  'nether-end-and-redstone': ['nether-travel-materials', 'end-progression', 'simple-redstone'],
};

export type QuestionSourceRecord = {
  accessedAt: string;
  evidenceNote: string;
  title: string;
  type: 'wiki' | 'official-article' | 'official-release-note' | 'technical-reference';
  url: string;
};

export type MasterQuestionRecord = {
  ageBand: '8-12';
  canonScope: CanonScope;
  categoryId: 'minecraft';
  clusterId: string;
  correctAnswer: string;
  difficulty: ContentDifficulty;
  distractors: [string, string, string];
  explanationEn: string;
  id: string;
  isActive: boolean;
  notes?: string;
  promptEn: string;
  reviewNotes?: string;
  reviewStatus: MasterQuestionReviewStatus;
  sourceVersion: string;
  sources: [QuestionSourceRecord, ...QuestionSourceRecord[]];
  tags: string[];
  topicId: ContentTopicId;
  translationStatus: TranslationStatus;
  versionGated: boolean;
};
