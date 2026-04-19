import { avatarPresets } from '../profile/avatar-presets';
import type { GuestProfile } from '../../state/app-store';
import { createDefaultRoomMatchSettings } from './room-match-settings';
import type { ActiveRoom, RoomParticipant } from './types';

const demoNames = ['PixelBee', 'GlowFox', 'CraftNova', 'RedstoneRay', 'BlockMint', 'SkySlime'];
const localRooms = new Map<string, ActiveRoom>();

function generateRoomCode() {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let code = '';

  for (let index = 0; index < 6; index += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return code;
}

function createHostParticipant(profile: GuestProfile): RoomParticipant {
  return {
    avatarId: profile.avatarId,
    id: 'local-player',
    isHost: true,
    isLocalPlayer: true,
    name: profile.nickname,
    ready: true,
  };
}

export function createOfflineRoom(profile: GuestProfile): ActiveRoom {
  const room: ActiveRoom = {
    createdAt: new Date().toISOString(),
    id: `offline-${Date.now()}`,
    participants: [createHostParticipant(profile)],
    roomCode: generateRoomCode(),
    settings: createDefaultRoomMatchSettings(),
    status: 'lobby',
  };

  localRooms.set(room.roomCode, room);
  return room;
}

export function joinOfflineRoom(profile: GuestProfile, roomCode: string): ActiveRoom {
  const normalizedCode = roomCode.trim().toUpperCase();
  const existingRoom = localRooms.get(normalizedCode);

  if (existingRoom) {
    return existingRoom;
  }

  const hostAvatar = avatarPresets[(avatarPresets.findIndex((item) => item.id === profile.avatarId) + 1) % avatarPresets.length];

  const room: ActiveRoom = {
    createdAt: new Date().toISOString(),
    id: `offline-${normalizedCode}`,
    participants: [
      {
        avatarId: hostAvatar.id,
        id: 'demo-host',
        isHost: true,
        isLocalPlayer: false,
        name: 'HostNova',
        ready: true,
      },
      createHostParticipant(profile),
      {
        avatarId: avatarPresets[2].id,
        id: 'demo-friend',
        isHost: false,
        isLocalPlayer: false,
        name: 'CraftBee',
        ready: true,
      },
    ],
    roomCode: normalizedCode,
    settings: createDefaultRoomMatchSettings(),
    status: 'lobby',
  };

  localRooms.set(room.roomCode, room);
  return room;
}

export function addDemoParticipants(room: ActiveRoom, maxParticipants = 4): ActiveRoom {
  const nextParticipants = [...room.participants];
  const usedNames = new Set(nextParticipants.map((participant) => participant.name));

  for (const name of demoNames) {
    if (nextParticipants.length >= maxParticipants) {
      break;
    }

    if (usedNames.has(name)) {
      continue;
    }

    const avatar = avatarPresets[nextParticipants.length % avatarPresets.length];

    nextParticipants.push({
      avatarId: avatar.id,
      id: `demo-${name.toLowerCase()}`,
      isHost: false,
      isLocalPlayer: false,
      name,
      ready: true,
    });
  }

  const updatedRoom: ActiveRoom = {
    ...room,
    participants: nextParticipants,
  };

  localRooms.set(updatedRoom.roomCode, updatedRoom);
  return updatedRoom;
}

export function toggleLocalReady(room: ActiveRoom): ActiveRoom {
  const updatedRoom: ActiveRoom = {
    ...room,
    participants: room.participants.map((participant) =>
      participant.isLocalPlayer ? { ...participant, ready: !participant.ready } : participant
    ),
  };

  localRooms.set(updatedRoom.roomCode, updatedRoom);
  return updatedRoom;
}

export function canStartOfflineRoom(room: ActiveRoom): boolean {
  return room.status === 'active' || (room.participants.length > 1 && room.participants.every((participant) => participant.ready));
}

export function startOfflineRoom(room: ActiveRoom): ActiveRoom {
  if (!canStartOfflineRoom(room)) {
    return room;
  }

  const updatedRoom = {
    ...room,
    status: 'active' as const,
  };

  localRooms.set(updatedRoom.roomCode, updatedRoom);
  return updatedRoom;
}

function stableScoreDelta(name: string, index: number) {
  const hash = name.split('').reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return (hash % 90) - 45 + index * 18;
}

export function createRoomStandings(room: ActiveRoom, playerScore: number) {
  const standings = room.participants.map((participant, index) => {
    const score = participant.isLocalPlayer
      ? playerScore
      : Math.max(420, playerScore - 70 + stableScoreDelta(participant.name, index));

    return {
      isPlayer: participant.isLocalPlayer,
      name: participant.name,
      score,
    };
  });

  return standings.sort((left, right) => right.score - left.score);
}
