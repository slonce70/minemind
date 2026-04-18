import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

import { requireAuthenticatedUser } from '../_shared/auth.ts';
import { handleCors, jsonResponse, requireJsonBody } from '../_shared/http.ts';
import { assertRoomMembership, getRoomByCode, listRoomParticipants } from '../_shared/rooms.ts';

type GetRoomStatePayload = {
  roomCode: string;
};

serve(async (request) => {
  const corsResponse = handleCors(request);
  if (corsResponse) {
    return corsResponse;
  }

  try {
    const user = await requireAuthenticatedUser(request);
    const body = await requireJsonBody<GetRoomStatePayload>(request);
    const room = await getRoomByCode(body.roomCode);

    if (!room) {
      throw new Error('Room not found.');
    }

    await assertRoomMembership(room.id, user.id);
    const participants = await listRoomParticipants(room.id);

    return jsonResponse({
      participants,
      room,
    });
  } catch (error) {
    return jsonResponse(
      {
        error: error instanceof Error ? error.message : 'Unknown get-room-state failure.',
      },
      400
    );
  }
});
