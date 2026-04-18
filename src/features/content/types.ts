export const contentDifficultyEnum = {
  easy: 'easy',
  medium: 'medium',
  hard: 'hard',
} as const;

export type ContentDifficulty = (typeof contentDifficultyEnum)[keyof typeof contentDifficultyEnum];

export const contentDifficulties = ['easy', 'medium', 'hard'] as const;

export const contentTopicEnum = {
  minecraft: 'minecraft',
} as const;

export type ContentTopic = (typeof contentTopicEnum)[keyof typeof contentTopicEnum];

export const contentTopics = ['minecraft'] as const;
