import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

import { requireAuthenticatedUser } from '../_shared/auth.ts';
import { serviceClient } from '../_shared/client.ts';
import { handleCors, jsonResponse, requireJsonBody } from '../_shared/http.ts';
import { getRoomByCode, listRoomParticipants } from '../_shared/rooms.ts';

type LeaveRoomPayload = {
  roomCode: string;
};

serve(async (request) => {
  const corsResponse = handleCors(request);
  if (corsResponse) {
    return corsResponse;
  }

  try {
    const user = await requireAuthenticatedUser(request);
    const body = await requireJsonBody<LeaveRoomPayload>(request);
    const room = await getRoomByCode(body.roomCode);

    if (!room) {
      // Nothing to leave; treat as success so the client can clear its state.
      return jsonResponse({ left: true, roomClosed: true });
    }

    const { error: deleteError } = await serviceClient
      .from('room_participants')
      .delete()
      .eq('room_id', room.id)
      .eq('player_id', user.id);

    if (deleteError) {
      throw deleteError;
    }

    const remaining = await listRoomParticipants(room.id);

    // Empty room: close it entirely.
    if (remaining.length === 0) {
      const { error: closeError } = await serviceClient
        .from('rooms')
        .delete()
        .eq('id', room.id);

      if (closeError) {
        throw closeError;
      }

      return jsonResponse({ left: true, roomClosed: true });
    }

    // Host left: hand the room to the earliest-joined remaining participant and
    // reset readiness so the new host controls the next round start.
    if (room.host_id === user.id) {
      const nextHost = remaining[0];
      const { error: reassignError } = await serviceClient
        .from('rooms')
        .update({ host_id: nextHost.player_id })
        .eq('id', room.id);

      if (reassignError) {
        throw reassignError;
      }
    }

    const participants = await listRoomParticipants(room.id);
    const updatedRoom = await getRoomByCode(body.roomCode);

    return jsonResponse({
      left: true,
      participants,
      room: updatedRoom,
      roomClosed: false,
    });
  } catch (error) {
    return jsonResponse(
      {
        error: error instanceof Error ? error.message : 'Unknown leave-room failure.',
      },
      400
    );
  }
});
