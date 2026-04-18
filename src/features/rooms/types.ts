import type { ContentDifficulty } from '../content/types';
import type { QuizQuestion } from '../quiz/types';
import type { RoomMatchSettings } from './room-match-settings';

export type RoomParticipant = {
  avatarId: string;
  id: string;
  isHost: boolean;
  isLocalPlayer: boolean;
  name: string;
  ready: boolean;
};

export type ActiveRoom = {
  createdAt: string;
  id?: string;
  difficulty?: ContentDifficulty;
  roundId?: string;
  roomCode: string;
  settings: RoomMatchSettings;
  status: 'active' | 'lobby';
  participants: RoomParticipant[];
};

export type ActiveRoomRound = {
  contentPackVersion?: string;
  difficulty?: ContentDifficulty;
  mode: 'room';
  questions: QuizQuestion[];
  roomCode: string;
  roundId?: string;
  source: 'demo' | 'supabase';
};
