import type { QuizResultSummary } from '../quiz/types';

export type MatchMode = 'solo' | 'room' | 'classroom';
export type MatchTransport = 'local' | 'supabase' | 'lan-host' | 'bluetooth-peer';
export type MatchAuthority = 'client' | 'server' | 'host-device';
export type MatchSyncStatus = 'local-only' | 'pending-upload' | 'synced' | 'recovered';

export type MatchRecordParticipant = {
  id?: string;
  isPlayer: boolean;
  name: string;
  score: number;
};

export type MatchRecord = {
  authority: MatchAuthority;
  bestStreak: number;
  breakdown: QuizResultSummary['breakdown'];
  completedAt: string;
  correctAnswers: number;
  difficulty?: QuizResultSummary['difficulty'];
  id: string;
  isDemo: boolean;
  mode: MatchMode;
  participants: MatchRecordParticipant[];
  questionCount: number;
  roomCode?: string;
  score: number;
  speedBonus: number;
  syncStatus: MatchSyncStatus;
  transport: MatchTransport;
};

export type NormalizeMatchRecordInput = {
  authority: MatchAuthority;
  input: QuizResultSummary;
  isDemo: boolean;
  syncStatus?: MatchSyncStatus;
  transport: MatchTransport;
};
