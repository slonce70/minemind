import type { QuizQuestion } from '../quiz/types';

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
  roundId?: string;
  roomCode: string;
  status: 'active' | 'lobby';
  participants: RoomParticipant[];
};

export type ActiveRoomRound = {
  mode: 'room';
  questions: QuizQuestion[];
  roomCode: string;
  roundId?: string;
  source: 'demo' | 'supabase';
};
