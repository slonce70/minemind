import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

import { requireAuthenticatedUser } from '../_shared/auth.ts';
import { serviceClient } from '../_shared/client.ts';
import { GameError } from '../_shared/error-codes.ts';
import { errorResponse, handleCors, jsonResponse, requireJsonBody } from '../_shared/http.ts';
import { loadQuestionsInOrder, sanitizeQuestionsForClient } from '../_shared/questions.ts';
import { assertRoomMembership, getRoomByCode, listRoomParticipants } from '../_shared/rooms.ts';

type GetRoomRoundPayload = {
  roomCode: string;
};

serve(async (request) => {
  const corsResponse = handleCors(request);
  if (corsResponse) {
    return corsResponse;
  }

  try {
    const user = await requireAuthenticatedUser(request);
    const body = await requireJsonBody<GetRoomRoundPayload>(request);
    const room = await getRoomByCode(body.roomCode);

    if (!room) {
      throw new GameError('room_not_found', 'Room not found.');
    }

    await assertRoomMembership(room.id, user.id);

    if (!room.current_round_id) {
      throw new GameError('no_active_round', 'Room does not have an active round.');
    }

    const { data: round, error: roundError } = await serviceClient
      .from('round_sessions')
      .select('id, room_id, question_ids, started_at, ends_at, content_pack_version, difficulty, question_count, topic_mode')
      .eq('id', room.current_round_id)
      .single();

    if (roundError || !round) {
      throw roundError ?? new GameError('round_not_found', 'Round not found.');
    }

    const questions = await loadQuestionsInOrder(round.question_ids);

    return jsonResponse({
      participants: await listRoomParticipants(room.id),
      questions: sanitizeQuestionsForClient(questions, round.id),
      room,
      roomCode: room.room_code,
      round,
    });
  } catch (error) {
    return errorResponse(error);
  }
});
