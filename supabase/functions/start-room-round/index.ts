import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

import { requireAuthenticatedUser } from '../_shared/auth.ts';
import { serviceClient } from '../_shared/client.ts';
import { GameError } from '../_shared/error-codes.ts';
import { errorResponse, handleCors, jsonResponse, requireJsonBody } from '../_shared/http.ts';
import {
  loadQuestionsInOrder,
  pickRoundQuestionIds,
  resolveQuestionLocale,
  sanitizeQuestionsForClient,
} from '../_shared/questions.ts';
import { getRoomByCode, listRoomParticipants } from '../_shared/rooms.ts';
import { computeRoundEndsAt, resolveDifficulty } from '../_shared/round-integrity.ts';

type StartRoomRoundPayload = {
  locale?: 'en' | 'ru' | 'uk';
  roomCode: string;
};

serve(async (request) => {
  const corsResponse = handleCors(request);
  if (corsResponse) {
    return corsResponse;
  }

  try {
    const user = await requireAuthenticatedUser(request);
    const body = await requireJsonBody<StartRoomRoundPayload>(request);
    const room = await getRoomByCode(body.roomCode);

    if (!room) {
      throw new GameError('room_not_found', 'Room not found.');
    }

    if (room.current_round_id) {
      throw new GameError('room_in_progress', 'Room already has an active round.');
    }

    if (room.host_id !== user.id) {
      throw new GameError('host_only', 'Only the room host can start the round.');
    }

    const participants = await listRoomParticipants(room.id);

    if (participants.length < 2) {
      throw new GameError('not_enough_players', 'Room needs at least two players.');
    }

    if (participants.some((participant) => !participant.ready_state)) {
      throw new GameError('players_not_ready', 'All players need to be ready before the battle starts.');
    }

    const questionIds = await pickRoundQuestionIds(resolveDifficulty(room.difficulty), room.question_count);
    const startedAt = new Date();

    const { data: round, error: roundError } = await serviceClient
      .from('round_sessions')
      .insert({
        content_pack_version: room.content_pack_version,
        difficulty: room.difficulty,
        question_count: room.question_count,
        ends_at: computeRoundEndsAt({
          difficulty: resolveDifficulty(room.difficulty),
          questionCount: questionIds.length,
          startedAt,
        }).toISOString(),
        question_ids: questionIds,
        room_id: room.id,
        started_at: startedAt.toISOString(),
        topic_mode: room.topic_mode,
      })
      .select('id, room_id, question_ids, started_at, ends_at, content_pack_version, difficulty, question_count, topic_mode')
      .single();

    if (roundError || !round) {
      throw roundError ?? new Error('Unable to create room round.');
    }

    const { error: roomUpdateError } = await serviceClient
      .from('rooms')
      .update({
        current_round_id: round.id,
        status: 'active',
      })
      .eq('id', room.id);

    if (roomUpdateError) {
      throw roomUpdateError;
    }

    return jsonResponse({
      participants,
      // The host reads in their language; every other player loads the round in theirs.
      questions: sanitizeQuestionsForClient(
        await loadQuestionsInOrder(questionIds, resolveQuestionLocale(body.locale)),
        round.id
      ),
      room: {
        ...room,
        current_round_id: round.id,
        status: 'active',
      },
      roomCode: room.room_code,
      round,
    });
  } catch (error) {
    return errorResponse(error);
  }
});
