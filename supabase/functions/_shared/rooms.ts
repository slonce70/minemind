import { serviceClient } from './client.ts';
import { assertRoomStatus } from './validation.ts';

export async function getRoomByCode(roomCode: string) {
  const { data: room, error } = await serviceClient
    .from('rooms')
    .select('id, room_code, host_id, status, current_round_id')
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

  return (data ?? []).map((row) => ({
    avatar_id: row.guest_profiles.avatar_id,
    nickname: row.guest_profiles.nickname,
    player_id: row.player_id,
    ready_state: row.ready_state,
  }));
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
    throw new Error('User is not a participant of this room.');
  }
}
