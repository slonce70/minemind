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
  /** Why a finished room was closed by the server, when it says. */
  closedReason?: 'host-deleted' | 'inactive';
  createdAt: string;
  id?: string;
  difficulty?: ContentDifficulty;
  roundId?: string;
  roomCode: string;
  settings: RoomMatchSettings;
  status: 'active' | 'lobby' | 'waiting' | 'finalizing' | 'finished';
  participants: RoomParticipant[];
};

export type RoundStanding = {
  correctCount: number;
  name: string;
  playerId: string;
  rank: number;
  score: number;
};

/** Live rooms: everyone follows one server timeline (see questionWindow in game-rules). */
export type RoundTimeline = {
  questionCount: number;
  /** Correct option (display order) of each closed question: the big screen reveals it. */
  revealed?: Record<string, number>;
  /** Server clock minus device clock, measured on the last response. */
  serverOffsetMs: number;
  standings: RoundStanding[];
  /** How many closed questions the standings cover (they refresh a moment after each close). */
  standingsQuestionCount: number;
  startedAt: string;
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
  timeline?: RoundTimeline;
};
