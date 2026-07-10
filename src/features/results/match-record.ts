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
  modeOverride?: MatchMode;
  /**
   * Stable identifier of the round this record came from. When provided it
   * anchors the record id so the same round produces the same id whether it was
   * built at finalize time or recovered later, letting saveMatchRecord dedupe
   * instead of storing two entries with drifting completedAt timestamps.
   */
  roundId?: string;
  syncStatus?: MatchSyncStatus;
  transport: MatchTransport;
};
