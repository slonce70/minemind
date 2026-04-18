import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

import { requireAuthenticatedUser } from '../_shared/auth.ts';
import { serviceClient } from '../_shared/client.ts';
import { handleCors, jsonResponse, requireJsonBody } from '../_shared/http.ts';
import { assertRoomMembership, getRoomByCode, listRoomParticipants } from '../_shared/rooms.ts';

type SetRoomReadyPayload = {
  ready: boolean;
  roomCode: string;
};

serve(async (request) => {
  const corsResponse = handleCors(request);
  if (corsResponse) {
    return corsResponse;
  }

  try {
    const user = await requireAuthenticatedUser(request);
    const body = await requireJsonBody<SetRoomReadyPayload>(request);
    const room = await getRoomByCode(body.roomCode);

    if (!room) {
      throw new Error('Room not found.');
    }

    await assertRoomMembership(room.id, user.id);

    const { error: updateError } = await serviceClient
      .from('room_participants')
      .update({
        ready_state: body.ready,
      })
      .eq('room_id', room.id)
      .eq('player_id', user.id);

    if (updateError) {
      throw updateError;
    }

    return jsonResponse({
      participants: await listRoomParticipants(room.id),
      room,
    });
  } catch (error) {
    return jsonResponse(
      {
        error: error instanceof Error ? error.message : 'Unknown set-room-ready failure.',
      },
      400
    );
  }
});
