import type { GuestProfile } from '../../state/app-store';
import {
  parseCreateOrJoinRoomResponse,
  parseFinalizeRoomResponse,
  parseStartRoomRoundResponse,
} from '../../lib/api-contracts';
import { toPlayerSafeErrorMessage } from '../shared/app-copy';
import type { AppLocale } from '../../lib/locale';
import { getAuthenticatedUser, invokeSupabaseFunction } from '../../lib/supabase';
import { createDefaultRoomMatchSettings, type RoomMatchSettings } from './room-match-settings';
import type { QuizResultSummary, QuizQuestion } from '../quiz/types';
import type { ActiveRoom, ActiveRoomRound, RoomParticipant } from './types';
import { buildRecoveredRoomResult } from '../results/recover-room-result';
import { normalizeMatchRecord } from '../results/normalize-match-record';

type RoomParticipantResponse = {
  avatar_id: string;
  nickname: string;
  player_id: string;
  ready_state: boolean;
};

type RoomResponse = {
  content_pack_version?: string | null;
  current_round_id?: string | null;
  difficulty?: ActiveRoom['difficulty'];
  host_id: string;
  id: string;
  question_count?: number | null;
  room_code: string;
  screen_mode?: boolean | null;
  status: 'active' | 'completed' | 'finalizing' | 'finished' | 'lobby' | 'waiting';
  topic_mode?: 'mixed' | null;
};

type CreateOrJoinRoomResponse = {
  participants: RoomParticipantResponse[];
  room: RoomResponse;
};

type StartRoomRoundResponse = {
  participants: RoomParticipantResponse[];
  questions: QuizQuestion[];
  room: RoomResponse;
  roomCode: string;
  round: {
    content_pack_version?: string | null;
    difficulty?: ActiveRoom['difficulty'];
    ends_at?: string | null;
    id: string;
    question_count?: number | null;
    question_ids: string[];
    room_id: string;
    started_at: string;
    topic_mode?: 'mixed' | null;
  };
};

type FinalizeRoomResponse = {
  rankings: {
    best_streak: number;
    correct_count: number;
    nickname: string;
    player_id: string;
    rank: number;
    round_id: string;
    score: number;
  }[];
  roomId: string;
  roundId: string;
  status: 'completed' | 'pending';
};

const FINALIZE_WAIT_INTERVAL_MS = 1500;
const FINALIZE_WAIT_MAX_ATTEMPTS = 10;

function normalizeRoomStatus(status: RoomResponse['status']): ActiveRoom['status'] {
  switch (status) {
    case 'active':
      return 'active';
    case 'waiting':
      return 'waiting';
    case 'finalizing':
      return 'finalizing';
    case 'completed':
    case 'finished':
      return 'finished';
    case 'lobby':
    default:
      return 'lobby';
  }
}

async function mapParticipants(participants: RoomParticipantResponse[]) {
  const currentUser = await getAuthenticatedUser();

  return participants.map<RoomParticipant>((participant) => ({
    avatarId: participant.avatar_id,
    id: participant.player_id,
    isHost: false,
    isLocalPlayer: participant.player_id === currentUser.id,
    name: participant.nickname,
    ready: participant.ready_state,
  }));
}

async function mapRoom(payload: CreateOrJoinRoomResponse) {
  const participants = await mapParticipants(payload.participants);
  const difficulty = payload.room.difficulty ?? 'medium';
  const settings = createDefaultRoomMatchSettings(difficulty);
  const status = normalizeRoomStatus(payload.room.status);

  if (payload.room.content_pack_version) {
    settings.contentPackVersion = payload.room.content_pack_version;
  }

  if (payload.room.question_count === 8) {
    settings.questionCount = payload.room.question_count;
  }

  if (payload.room.topic_mode === 'mixed') {
    settings.topicMode = payload.room.topic_mode;
  }

  settings.screenMode = payload.room.screen_mode === true;

  return {
    createdAt: new Date().toISOString(),
    difficulty,
    id: payload.room.id,
    participants: participants.map((participant) => ({
      ...participant,
      isHost: participant.id === payload.room.host_id,
    })),
    roomCode: payload.room.room_code,
    roundId: payload.room.current_round_id ?? undefined,
    settings,
    status,
  } satisfies ActiveRoom;
}

export async function createLiveRoom(profile: GuestProfile, settings: RoomMatchSettings) {
  try {
    const payload = await invokeSupabaseFunction<
      CreateOrJoinRoomResponse,
      {
        contentPackVersion: string;
        difficulty: RoomMatchSettings['difficulty'];
        locale: GuestProfile['locale'];
        questionCount: 8;
        screenMode: boolean;
        topicMode: 'mixed';
      }
    >(
      'create-room',
      {
        contentPackVersion: settings.contentPackVersion,
        difficulty: settings.difficulty,
        locale: profile.locale,
        questionCount: settings.questionCount,
        screenMode: settings.screenMode,
        topicMode: settings.topicMode,
      }
    );

    return mapRoom(parseCreateOrJoinRoomResponse(payload));
  } catch (error) {
    throw new Error(toPlayerSafeErrorMessage(error));
  }
}

export async function updateLiveRoomSettings(activeRoom: ActiveRoom, settings: RoomMatchSettings) {
  try {
    const payload = await invokeSupabaseFunction<
      CreateOrJoinRoomResponse,
      {
        contentPackVersion: string;
        difficulty: RoomMatchSettings['difficulty'];
        questionCount: 8;
        roomCode: string;
        screenMode: boolean;
        topicMode: 'mixed';
      }
    >('update-room-settings', {
      contentPackVersion: settings.contentPackVersion,
      difficulty: settings.difficulty,
      questionCount: settings.questionCount,
      roomCode: activeRoom.roomCode,
      screenMode: settings.screenMode,
      topicMode: settings.topicMode,
    });

    return mapRoom(parseCreateOrJoinRoomResponse(payload));
  } catch (error) {
    throw new Error(toPlayerSafeErrorMessage(error));
  }
}

export async function joinLiveRoom(roomCode: string) {
  try {
    const payload = await invokeSupabaseFunction<CreateOrJoinRoomResponse, { roomCode: string }>(
      'join-room',
      {
        roomCode,
      }
    );

    return mapRoom(parseCreateOrJoinRoomResponse(payload));
  } catch (error) {
    throw new Error(toPlayerSafeErrorMessage(error));
  }
}

export async function leaveLiveRoom(roomCode: string) {
  // Best-effort: releases the participant slot server-side (reassigns host or
  // closes an empty room) so a departing player cannot freeze the lobby or the
  // finalize count. Failures are non-fatal — the local state is cleared anyway.
  try {
    await invokeSupabaseFunction<{ left: boolean }, { roomCode: string }>('leave-room', {
      roomCode,
    });
  } catch {
    // Swallow: leaving is a local action from the user's perspective.
  }
}

export async function refreshLiveRoom(roomCode: string) {
  try {
    const payload = await invokeSupabaseFunction<CreateOrJoinRoomResponse, { roomCode: string }>(
      'get-room-state',
      {
        roomCode,
      }
    );

    return mapRoom(parseCreateOrJoinRoomResponse(payload));
  } catch (error) {
    throw new Error(toPlayerSafeErrorMessage(error));
  }
}

export async function updateLiveReadyState(activeRoom: ActiveRoom, ready: boolean) {
  try {
    const payload = await invokeSupabaseFunction<CreateOrJoinRoomResponse, { ready: boolean; roomCode: string }>(
      'set-room-ready',
      {
        ready,
        roomCode: activeRoom.roomCode,
      }
    );

    return mapRoom(parseCreateOrJoinRoomResponse(payload));
  } catch (error) {
    throw new Error(toPlayerSafeErrorMessage(error));
  }
}

export async function startLiveRoomRound(activeRoom: ActiveRoom, profile: GuestProfile) {
  let payload: StartRoomRoundResponse;

  try {
    payload = await invokeSupabaseFunction<
      StartRoomRoundResponse,
      {
        contentPackVersion: string;
        difficulty: RoomMatchSettings['difficulty'];
        locale: GuestProfile['locale'];
        questionCount: 8;
        roomCode: string;
        topicMode: 'mixed';
      }
    >('start-room-round', {
      contentPackVersion: activeRoom.settings.contentPackVersion,
      difficulty: activeRoom.settings.difficulty,
      locale: profile.locale,
      questionCount: activeRoom.settings.questionCount,
      roomCode: activeRoom.roomCode,
      topicMode: activeRoom.settings.topicMode,
    });
  } catch (error) {
    throw new Error(toPlayerSafeErrorMessage(error));
  }

  const parsedPayload = parseStartRoomRoundResponse(payload);

  const room = await mapRoom({
    participants: parsedPayload.participants,
    room: parsedPayload.room,
  });

  return { room, round: mapLiveRound(parsedPayload, room) };
}

function mapLiveRound(payload: ReturnType<typeof parseStartRoomRoundResponse>, room: ActiveRoom): ActiveRoomRound {
  return {
    answers: Object.fromEntries(
      (payload.myAnswers ?? []).map((answer) => [
        answer.questionId,
        {
          correctIndex: answer.correctOption,
          explanation: answer.explanation,
          isCorrect: answer.isCorrect,
          selectedIndex: answer.selectedOption,
          timeLeft: Math.floor(answer.timeLeftMs / 1000),
        },
      ])
    ),
    contentPackVersion: payload.round.content_pack_version ?? room.settings.contentPackVersion,
    difficulty: payload.round.difficulty ?? room.settings.difficulty,
    endsAt: payload.round.ends_at ?? undefined,
    mode: 'room',
    questions: payload.questions,
    roomCode: payload.roomCode,
    roundId: payload.round.id,
    source: 'supabase',
    timeline: {
      questionCount: payload.questionCount ?? payload.round.question_ids.length,
      serverOffsetMs: payload.serverNow ? Date.parse(payload.serverNow) - Date.now() : 0,
      standings: (payload.standings ?? []).map((entry) => ({
        correctCount: entry.correct_count,
        name: entry.nickname,
        playerId: entry.player_id,
        rank: entry.rank,
        score: entry.score,
      })),
      revealed: Object.fromEntries((payload.revealed ?? []).map((entry) => [entry.questionId, entry.correctOption])),
      standingsQuestionCount: payload.standingsQuestionCount ?? 0,
      startedAt: payload.round.started_at,
    },
  };
}

/** Loads the room's current round in `locale`; every player reads the same questions in their language. */
export async function resumeLiveRoomRound(roomCode: string, locale: AppLocale) {
  let payload: StartRoomRoundResponse;

  try {
    payload = await invokeSupabaseFunction<
      StartRoomRoundResponse,
      {
        locale: AppLocale;
        roomCode: string;
      }
    >('get-room-round', {
      locale,
      roomCode,
    });
  } catch (error) {
    throw new Error(toPlayerSafeErrorMessage(error));
  }

  const parsedPayload = parseStartRoomRoundResponse(payload);

  const room = await mapRoom({
    participants: parsedPayload.participants,
    room: parsedPayload.room,
  });

  return { room, round: mapLiveRound(parsedPayload, room) };
}

export async function submitLiveRoomAnswer(
  round: ActiveRoomRound,
  questionId: string,
  selectedOption: number,
  locale: AppLocale
) {
  if (!round.roundId) {
    return null;
  }

  return invokeSupabaseFunction<
    {
      accepted: boolean;
      correctOption: number;
      explanation: string;
      isCorrect: boolean;
      scoreDelta: number;
    },
    {
      locale: AppLocale;
      questionId: string;
      roundId: string;
      selectedOption: number;
    }
  >('submit-answer', {
    locale,
    questionId,
    roundId: round.roundId,
    selectedOption,
  });
}

export async function finalizeLiveRoomRound(
  round: ActiveRoomRound,
  localFallback?: QuizResultSummary
) {
  if (!round.roundId) {
    return {
      record:
        localFallback
          ? normalizeMatchRecord({
              authority: 'server',
              input: localFallback,
              isDemo: false,
              syncStatus: 'synced',
              transport: 'supabase',
            })
          : buildRecoveredRoomResult(round, [], ''),
      status: 'completed' as const,
    };
  }

  const currentUser = await getAuthenticatedUser();
  let payload: FinalizeRoomResponse | null = null;

  for (let attempt = 0; attempt < FINALIZE_WAIT_MAX_ATTEMPTS; attempt += 1) {
    try {
      payload = parseFinalizeRoomResponse(
        await invokeSupabaseFunction<FinalizeRoomResponse, { roundId: string }>(
          'finalize-round',
          {
            roundId: round.roundId,
          }
        )
      );
    } catch (error) {
      throw new Error(toPlayerSafeErrorMessage(error));
    }

    if (payload.status === 'completed') {
      break;
    }

    await new Promise((resolve) => setTimeout(resolve, FINALIZE_WAIT_INTERVAL_MS));
  }

  if (!payload) {
    return {
      record:
        localFallback
          ? normalizeMatchRecord({
              authority: 'server',
              input: localFallback,
              isDemo: false,
              roundId: round.roundId,
              syncStatus: 'recovered',
              transport: 'supabase',
            })
          : undefined,
      status: 'pending' as const,
    };
  }

  const resolvedStandings = payload.rankings
    .sort((left, right) => left.rank - right.rank)
    .map((entry) => ({
      isPlayer: entry.player_id === currentUser.id,
      name: entry.nickname,
      score: entry.score,
    }));
  const recoveredRecord = buildRecoveredRoomResult(round, payload.rankings, currentUser.id);

  return {
    record:
      localFallback
        ? normalizeMatchRecord({
            authority: 'server',
            input: {
              ...localFallback,
              roomCode: round.roomCode,
              standings: resolvedStandings.length > 0 ? resolvedStandings : localFallback.standings,
            },
            isDemo: false,
            roundId: round.roundId,
            syncStatus: 'synced',
            transport: 'supabase',
          })
        : recoveredRecord,
    status: payload.status,
  };
}

export function createDemoRoomRound(room: ActiveRoom, questions: QuizQuestion[]): ActiveRoomRound {
  return {
    contentPackVersion: room.settings.contentPackVersion,
    difficulty: room.settings.difficulty,
    mode: 'room',
    questions,
    roomCode: room.roomCode,
    source: 'demo',
  };
}
