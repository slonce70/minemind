import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

import { requireAuthenticatedUser } from '../_shared/auth.ts';
import { serviceClient } from '../_shared/client.ts';
import { GameError } from '../_shared/error-codes.ts';
import { errorResponse, handleCors, jsonResponse, requireJsonBody } from '../_shared/http.ts';
import { enforceRateLimit } from '../_shared/limits.ts';
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
    // Also throttles guessing room codes.
    await enforceRateLimit(user.id, 'join-room');
    const room = await getRoomByCode(body.roomCode);

    if (!room) {
      throw new GameError('room_not_found', 'Room not found.');
    }

    if (room.status === 'active' || room.current_round_id) {
      throw new GameError('room_in_progress', 'Room already has a battle in progress.');
    }

    // Only a room in the lobby accepts new players: 'lobby' right after
    // create-room, 'waiting' after a finished round. Joining during
    // 'finalizing' would inflate the expected submission count and freeze the
    // finalize, while 'finished' rooms are effectively closed.
    if (room.status !== 'lobby' && room.status !== 'waiting') {
      throw new GameError('room_closed', 'Room is not accepting new players.');
    }

    const existingParticipants = await listRoomParticipants(room.id);
    const isAlreadyParticipant = existingParticipants.some(
      (participant) => participant.player_id === user.id
    );
    const MAX_ROOM_PARTICIPANTS = 8;

    if (!isAlreadyParticipant && existingParticipants.length >= MAX_ROOM_PARTICIPANTS) {
      throw new GameError('room_full', 'Room is full.');
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
      // The database trigger has the final word on the player cap when joins race.
      throw upsertError.message === 'room_full' ? new GameError('room_full', 'Room is full.') : upsertError;
    }

    const participants = await listRoomParticipants(room.id);

    return jsonResponse({
      participants,
      room,
    });
  } catch (error) {
    return errorResponse(error);
  }
});
