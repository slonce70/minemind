import type { ContentDifficulty } from '../content/types';

export type RoomMatchSettings = {
  contentPackVersion: string;
  difficulty: ContentDifficulty;
  questionCount: 8;
  topicMode: 'mixed';
};

export function createDefaultRoomMatchSettings(
  difficulty: ContentDifficulty = 'medium'
): RoomMatchSettings {
  return {
    contentPackVersion: 'minecraft-v1',
    difficulty,
    questionCount: 8,
    topicMode: 'mixed',
  };
}
