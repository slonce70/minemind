import type { ContentDifficulty } from '../content/types';
import type { MatchRecord } from '../results/match-record';
import type { QuizAnswerMap, QuizResultSummary } from '../quiz/types';
import type { ActiveRoomRound, RoomParticipant } from '../rooms/types';

export type ClassroomSessionRole = 'host' | 'participant';
export type ClassroomSessionStatus = 'lobby' | 'active' | 'finished';
export const classroomDefaultPort = 36735;

export type ClassroomSession = {
  difficulty: ContentDifficulty;
  hostAddress?: string;
  hostPort?: number;
  id: string;
  participants: RoomParticipant[];
  role: ClassroomSessionRole;
  roomCode: string;
  status: ClassroomSessionStatus;
};

export type HostSessionConfig = {
  difficulty: ContentDifficulty;
  hostAddress?: string;
  port?: number;
  hostProfile: RoomParticipant;
  roomCode: string;
};

export type JoinPayload = {
  guestProfile: RoomParticipant;
  hostAddress: string;
  port?: number;
  roomCode: string;
};

export type ClassroomTransportEvent =
  | { type: 'participant-joined'; participant: RoomParticipant; roomCode: string }
  | { type: 'participant-ready'; participantId: string; ready: boolean; roomCode: string }
  | { type: 'round-submitted'; participantId: string; answers: QuizAnswerMap; roomCode: string }
  | { type: 'round-started'; roomCode: string; round: ActiveRoomRound }
  | { type: 'round-finished'; records: ClassroomRoundRecordEnvelope[]; roomCode: string };

export type HostSessionHandle = {
  hostAddress?: string;
  port: number;
  roomCode: string;
  sessionId: string;
};

export type ClientSessionHandle = {
  hostAddress: string;
  port: number;
  roomCode: string;
  sessionId: string;
};

export type ClassroomRoundSummary = QuizResultSummary;

export type ClassroomRoundRecordEnvelope = {
  participantId: string;
  record: MatchRecord;
};
