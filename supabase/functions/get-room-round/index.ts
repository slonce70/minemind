import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

import { requireAuthenticatedUser } from '../_shared/auth.ts';
import { serviceClient } from '../_shared/client.ts';
import { handleCors, jsonResponse, requireJsonBody } from '../_shared/http.ts';
import { sanitizeQuestionsForClient } from '../_shared/questions.ts';
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
      throw new Error('Room not found.');
    }

    await assertRoomMembership(room.id, user.id);

    if (!room.current_round_id) {
      throw new Error('Room does not have an active round.');
    }

    const { data: round, error: roundError } = await serviceClient
      .from('round_sessions')
      .select('id, room_id, question_ids, started_at, ends_at')
      .eq('id', room.current_round_id)
      .single();

    if (roundError || !round) {
      throw roundError ?? new Error('Round not found.');
    }

    const { data: questions, error: questionsError } = await serviceClient
      .from('questions')
      .select(
        'id,prompt,option_a,option_b,option_c,option_d,correct_option,explanation,sort_order'
      )
      .in('id', round.question_ids)
      .order('sort_order', { ascending: true });

    if (questionsError || !questions) {
      throw questionsError ?? new Error('Unable to load questions for the round.');
    }

    return jsonResponse({
      participants: await listRoomParticipants(room.id),
      questions: sanitizeQuestionsForClient(questions),
      room,
      roomCode: room.room_code,
      round,
    });
  } catch (error) {
    return jsonResponse(
      {
        error: error instanceof Error ? error.message : 'Unknown get-room-round failure.',
      },
      400
    );
  }
});
