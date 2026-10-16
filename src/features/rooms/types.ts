import type { ContentDifficulty } from '../content/types';
import type { QuizAnswerMap, QuizQuestion } from '../quiz/types';
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
  status: 'active' | 'lobby' | 'waiting' | 'finalizing' | 'finished';
  participants: RoomParticipant[];
};

export type ActiveRoomRound = {
  /** Answers the server already holds for this player (reconnect). */
  answers?: QuizAnswerMap;
  contentPackVersion?: string;
  difficulty?: ContentDifficulty;
  /** Server deadline for live rooms; after it unanswered questions score 0. */
  endsAt?: string;
  mode: 'room' | 'classroom';
  questions: QuizQuestion[];
  roomCode: string;
  roundId?: string;
  source: 'classroom' | 'demo' | 'supabase';
};
