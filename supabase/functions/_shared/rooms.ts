import { serviceClient } from './client.ts';
import { GameError } from './error-codes.ts';
import { assertRoomStatus } from './validation.ts';

export async function getRoomByCode(roomCode: string) {
  const { data: room, error } = await serviceClient
    .from('rooms')
    .select('id, room_code, host_id, status, closed_reason, current_round_id, content_pack_version, difficulty, question_count, topic_mode, screen_mode')
    .eq('room_code', roomCode.toUpperCase())
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (room?.status) {
    assertRoomStatus(room.status);
  }

  return room;
}

export async function listRoomParticipants(roomId: string) {
  const { data, error } = await serviceClient
    .from('room_participants')
    .select('player_id, ready_state, guest_profiles!inner(nickname, avatar_id)')
    .eq('room_id', roomId)
    .order('joined_at', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => {
    const profile = Array.isArray(row.guest_profiles) ? row.guest_profiles[0] : row.guest_profiles;

    if (!profile) {
      throw new Error('Room participant profile not found.');
    }

    return {
      avatar_id: profile.avatar_id,
      nickname: profile.nickname,
      player_id: row.player_id,
      ready_state: row.ready_state,
    };
  });
}

export async function assertRoomMembership(roomId: string, playerId: string) {
  const { data, error } = await serviceClient.rpc('is_room_participant', {
    target_room_id: roomId,
    target_user_id: playerId,
  });

  if (error) {
    throw error;
  }

  if (!data) {
    throw new GameError('not_room_member', 'User is not a participant of this room.');
  }
}

/** Who plays a room round: everyone, except the host when the host's device is the big screen. */
export function playingParticipants<T extends { player_id: string }>(
  room: { host_id: string | null; screen_mode?: boolean | null },
  participants: T[]
) {
  return room.screen_mode ? participants.filter((participant) => participant.player_id !== room.host_id) : participants;
}
