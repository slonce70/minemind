import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

import { requireAuthenticatedUser } from '../_shared/auth.ts';
import { serviceClient } from '../_shared/client.ts';
import { handleCors, jsonResponse, requireJsonBody } from '../_shared/http.ts';
import { listRoomParticipants } from '../_shared/rooms.ts';

type CreateRoomPayload = {
  locale?: 'en' | 'ru' | 'uk';
};

serve(async (request) => {
  const corsResponse = handleCors(request);
  if (corsResponse) {
    return corsResponse;
  }

  try {
    const user = await requireAuthenticatedUser(request);
    await requireJsonBody<CreateRoomPayload>(request);

    const { data: roomCode, error: roomCodeError } = await serviceClient.rpc('generate_room_code');

    if (roomCodeError || !roomCode) {
      throw roomCodeError ?? new Error('Unable to generate room code.');
    }

    const { data: room, error: roomError } = await serviceClient
      .from('rooms')
      .insert({
        host_id: user.id,
        room_code: roomCode,
      })
      .select('id, room_code, host_id, status, current_round_id')
      .single();

    if (roomError || !room) {
      throw roomError ?? new Error('Unable to create room.');
    }

    const { error: participantError } = await serviceClient.from('room_participants').insert({
      player_id: user.id,
      ready_state: true,
      room_id: room.id,
    });

    if (participantError) {
      throw participantError;
    }

    const participants = await listRoomParticipants(room.id);

    return jsonResponse({
      participants,
      room,
    });
  } catch (error) {
    return jsonResponse(
      {
        error: error instanceof Error ? error.message : 'Unknown create-room failure.',
      },
      400
    );
  }
});
