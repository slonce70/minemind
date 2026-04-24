export type ContentDifficulty = 'easy' | 'medium' | 'hard';

export type RoomMatchSettingsPayload = {
  contentPackVersion?: string;
  difficulty?: ContentDifficulty;
  questionCount?: number;
  topicMode?: 'mixed';
};

export type RoomMatchSettings = {
  content_pack_version: string;
  difficulty: ContentDifficulty;
  question_count: 8;
  topic_mode: 'mixed';
};

const difficultyValues = ['easy', 'medium', 'hard'] as const;

function parseDifficulty(value: unknown): ContentDifficulty {
  return difficultyValues.includes(value as ContentDifficulty)
    ? value as ContentDifficulty
    : 'medium';
}

export function parseRoomMatchSettingsPayload(
  payload?: RoomMatchSettingsPayload
): RoomMatchSettings {
  return {
    content_pack_version: payload?.contentPackVersion ?? 'minecraft-v1',
    difficulty: parseDifficulty(payload?.difficulty),
    question_count: 8,
    topic_mode: 'mixed',
  };
}

export function normalizeRoomMatchSettingsRow(row: {
  content_pack_version?: string | null;
  difficulty?: string | null;
  question_count?: number | null;
  topic_mode?: string | null;
}): RoomMatchSettings {
  return {
    content_pack_version: row.content_pack_version ?? 'minecraft-v1',
    difficulty: parseDifficulty(row.difficulty),
    question_count: row.question_count === 8 ? 8 : 8,
    topic_mode: row.topic_mode === 'mixed' ? 'mixed' : 'mixed',
  };
}
