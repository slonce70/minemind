import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

import { requireAuthenticatedUser } from '../_shared/auth.ts';
import { serviceClient } from '../_shared/client.ts';
import { handleCors, jsonResponse, requireJsonBody } from '../_shared/http.ts';
import { getLocalizedQuestionPack, sanitizeQuestionsForClient } from '../_shared/questions.ts';
import { getRoomByCode, listRoomParticipants } from '../_shared/rooms.ts';

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
      throw new Error('Room not found.');
    }

    if (room.current_round_id) {
      throw new Error('Room already has an active round.');
    }

    if (room.host_id !== user.id) {
      throw new Error('Only the room host can start the round.');
    }

    const participants = await listRoomParticipants(room.id);

    if (participants.length < 2) {
      throw new Error('Room needs at least two players.');
    }

    if (participants.some((participant) => !participant.ready_state)) {
      throw new Error('All players need to be ready before the battle starts.');
    }

    const { questions } = await getLocalizedQuestionPack(
      body.locale ?? 'en',
      room.difficulty,
      room.question_count
    );
    const questionIds = questions.map((question) => question.id);

    const { data: round, error: roundError } = await serviceClient
      .from('round_sessions')
      .insert({
        content_pack_version: room.content_pack_version,
        difficulty: room.difficulty,
        question_count: room.question_count,
        question_ids: questionIds,
        room_id: room.id,
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
      questions: sanitizeQuestionsForClient(questions),
      room: {
        ...room,
        current_round_id: round.id,
        status: 'active',
      },
      roomCode: room.room_code,
      round,
    });
  } catch (error) {
    return jsonResponse(
      {
        error: error instanceof Error ? error.message : 'Unknown start-room-round failure.',
      },
      400
    );
  }
});
