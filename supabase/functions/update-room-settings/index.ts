import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

import { requireAuthenticatedUser } from '../_shared/auth.ts';
import { serviceClient } from '../_shared/client.ts';
import { handleCors, jsonResponse, requireJsonBody } from '../_shared/http.ts';
import { parseRoomMatchSettingsPayload, type RoomMatchSettingsPayload } from '../_shared/room-settings.ts';
import { getRoomByCode, listRoomParticipants } from '../_shared/rooms.ts';

type UpdateRoomSettingsPayload = RoomMatchSettingsPayload & {
  roomCode: string;
};

serve(async (request) => {
  const corsResponse = handleCors(request);
  if (corsResponse) {
    return corsResponse;
  }

  try {
    const user = await requireAuthenticatedUser(request);
    const body = await requireJsonBody<UpdateRoomSettingsPayload>(request);
    const room = await getRoomByCode(body.roomCode);

    if (!room) {
      throw new Error('Room not found.');
    }

    if (room.host_id !== user.id) {
      throw new Error('Only the room host can update match settings.');
    }

    if (room.current_round_id || room.status === 'active' || room.status === 'finalizing') {
      throw new Error('Room settings can only be changed before a round starts.');
    }

    const settings = parseRoomMatchSettingsPayload(body);
    const { data: updatedRoom, error: updateError } = await serviceClient
      .from('rooms')
      .update(settings)
      .eq('id', room.id)
      .select('id, room_code, host_id, status, current_round_id, content_pack_version, difficulty, question_count, topic_mode')
      .single();

    if (updateError || !updatedRoom) {
      throw updateError ?? new Error('Unable to update room settings.');
    }

    return jsonResponse({
      participants: await listRoomParticipants(room.id),
      room: updatedRoom,
    });
  } catch (error) {
    return jsonResponse(
      {
        error: error instanceof Error ? error.message : 'Unknown update-room-settings failure.',
      },
      400
    );
  }
});
