import type { ContentDifficulty } from '../content/types';

export type RoomMatchSettings = {
  contentPackVersion: string;
  difficulty: ContentDifficulty;
  questionCount: 8;
  /** The host's device is the big screen (TV, projector) and does not play. */
  screenMode: boolean;
  topicMode: 'mixed';
};

export function createDefaultRoomMatchSettings(
  difficulty: ContentDifficulty = 'medium'
): RoomMatchSettings {
  return {
    contentPackVersion: 'minecraft-v1',
    difficulty,
    questionCount: 8,
    screenMode: false,
    topicMode: 'mixed',
  };
}
