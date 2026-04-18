import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

import { requireAuthenticatedUser } from '../_shared/auth.ts';
import { serviceClient } from '../_shared/client.ts';
import { handleCors, jsonResponse, requireJsonBody } from '../_shared/http.ts';
import { getRoomByCode, listRoomParticipants } from '../_shared/rooms.ts';

type JoinRoomPayload = {
  roomCode: string;
};

serve(async (request) => {
  const corsResponse = handleCors(request);
  if (corsResponse) {
    return corsResponse;
  }

  try {
    const user = await requireAuthenticatedUser(request);
    const body = await requireJsonBody<JoinRoomPayload>(request);
    const room = await getRoomByCode(body.roomCode);

    if (!room) {
      throw new Error('Room not found.');
    }

    if (room.status === 'active' || room.current_round_id) {
      throw new Error('Room already has a battle in progress.');
    }

    const { error: upsertError } = await serviceClient.from('room_participants').upsert(
      {
        player_id: user.id,
        ready_state: false,
        room_id: room.id,
      },
      {
        onConflict: 'room_id,player_id',
      }
    );

    if (upsertError) {
      throw upsertError;
    }

    const participants = await listRoomParticipants(room.id);

    return jsonResponse({
      participants,
      room,
    });
  } catch (error) {
    return jsonResponse(
      {
        error: error instanceof Error ? error.message : 'Unknown join-room failure.',
      },
      400
    );
  }
});
