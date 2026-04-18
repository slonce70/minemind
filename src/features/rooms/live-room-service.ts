import type { GuestProfile } from '../../state/app-store';
import {
  parseCreateOrJoinRoomResponse,
  parseFinalizeRoomResponse,
  parseStartRoomRoundResponse,
} from '../../lib/api-contracts';
import { toPlayerSafeErrorMessage } from '../shared/app-copy';
import { getAuthenticatedUser, invokeSupabaseFunction } from '../../lib/supabase';
import { createDefaultRoomMatchSettings } from './room-match-settings';
import type { QuizResultSummary, QuizQuestion } from '../quiz/types';
import type { ActiveRoom, ActiveRoomRound, RoomParticipant } from './types';

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
    question_ids: string[];
    room_id: string;
    started_at: string;
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
  return status === 'active' ? 'active' : 'lobby';
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

  if (payload.room.content_pack_version) {
    settings.contentPackVersion = payload.room.content_pack_version;
  }

  if (payload.room.question_count === 8) {
    settings.questionCount = payload.room.question_count;
  }

  if (payload.room.topic_mode === 'mixed') {
    settings.topicMode = payload.room.topic_mode;
  }

  return {
    createdAt: new Date().toISOString(),
    difficulty,
    id: payload.room.id,
    participants: participants.map((participant) => ({
      ...participant,
      isHost: participant.id === payload.room.host_id,
    })),
    roomCode: payload.room.room_code,
    roundId:
      normalizeRoomStatus(payload.room.status) === 'active'
        ? payload.room.current_round_id ?? undefined
        : undefined,
    settings,
    status: normalizeRoomStatus(payload.room.status),
  } satisfies ActiveRoom;
}

export async function createLiveRoom(profile: GuestProfile) {
  try {
    const payload = await invokeSupabaseFunction<CreateOrJoinRoomResponse, { locale: GuestProfile['locale'] }>(
      'create-room',
      {
        locale: profile.locale,
      }
    );

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
        locale: GuestProfile['locale'];
        roomCode: string;
      }
    >('start-room-round', {
      locale: profile.locale,
      roomCode: activeRoom.roomCode,
    });
  } catch (error) {
    throw new Error(toPlayerSafeErrorMessage(error));
  }

  const parsedPayload = parseStartRoomRoundResponse(payload);

  const room = await mapRoom({
    participants: parsedPayload.participants,
    room: parsedPayload.room,
  });

  const round: ActiveRoomRound = {
    contentPackVersion:
      parsedPayload.round.content_pack_version ??
      room.settings.contentPackVersion,
    difficulty:
      parsedPayload.round.difficulty ??
      room.settings.difficulty,
    mode: 'room',
    questions: parsedPayload.questions,
    roomCode: parsedPayload.roomCode,
    roundId: parsedPayload.round.id,
    source: 'supabase',
  };

  return { room, round };
}

export async function resumeLiveRoomRound(roomCode: string) {
  let payload: StartRoomRoundResponse;

  try {
    payload = await invokeSupabaseFunction<
      StartRoomRoundResponse,
      {
        roomCode: string;
      }
    >('get-room-round', {
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

  return {
    room,
    round: {
      contentPackVersion:
        parsedPayload.round.content_pack_version ??
        room.settings.contentPackVersion,
      difficulty:
        parsedPayload.round.difficulty ??
        room.settings.difficulty,
      mode: 'room' as const,
      questions: parsedPayload.questions,
      roomCode: parsedPayload.roomCode,
      roundId: parsedPayload.round.id,
      source: 'supabase' as const,
    },
  };
}

export async function submitLiveRoomAnswer(
  round: ActiveRoomRound,
  questionId: string,
  selectedOption: number,
  timeLeftMs: number
) {
  if (!round.roundId) {
    return null;
  }

  return invokeSupabaseFunction<
    {
      accepted: boolean;
      explanation: string;
      isCorrect: boolean;
      scoreDelta: number;
    },
    {
      questionId: string;
      roundId: string;
      selectedOption: number;
      timeLeftMs: number;
    }
  >('submit-answer', {
    questionId,
    roundId: round.roundId,
    selectedOption,
    timeLeftMs,
  });
}

export async function finalizeLiveRoomRound(
  round: ActiveRoomRound,
  localFallback: QuizResultSummary
) {
  if (!round.roundId) {
    return {
      result: localFallback,
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
      result: localFallback,
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

  return {
    result: {
      ...localFallback,
      roomCode: round.roomCode,
      standings: resolvedStandings.length > 0 ? resolvedStandings : localFallback.standings,
    },
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
